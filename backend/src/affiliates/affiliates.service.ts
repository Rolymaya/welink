import { Injectable, BadRequestException, NotFoundException, Inject, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcrypt';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

@Injectable()
export class AffiliatesService {
    constructor(@Inject(PrismaService) private prisma: PrismaService) { }

    /**
     * Gera um código de referência único para uma organização
     */
    async generateReferralCode(organizationId: string): Promise<string> {
        const org = await this.prisma.organization.findUnique({
            where: { id: organizationId },
        });

        if (!org) {
            throw new NotFoundException('Organização não encontrada');
        }

        // Gera código baseado no slug + random
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        const code = `${org.slug.substring(0, 6).toUpperCase()}-${randomPart}`;

        return code;
    }

    /**
     * Cria ou obtém o perfil de afiliado de uma organização
     */
    async getOrCreateAffiliateProfile(organizationId: string) {
        let profile = await this.prisma.affiliateProfile.findUnique({
            where: { organizationId },
        });

        if (!profile) {
            const referralCode = await this.generateReferralCode(organizationId);
            profile = await this.prisma.affiliateProfile.create({
                data: {
                    organizationId,
                    referralCode,
                    walletBalance: new Decimal(0),
                    totalEarnings: new Decimal(0),
                },
            });
        }

        return profile;
    }

    /**
     * Vincula uma nova organização a um afiliado (referrer)
     */
    async bindReferral(newOrgId: string, referralCode: string) {
        if (!referralCode) return;

        // Busca o perfil do afiliado pelo código
        const referrerProfile = await this.prisma.affiliateProfile.findUnique({
            where: { referralCode },
        });

        if (!referrerProfile) {
            console.warn(`Código de referência inválido: ${referralCode}`);
            return;
        }

        // Verifica se a organização já foi referenciada
        const existingReferral = await this.prisma.affiliateReferral.findUnique({
            where: { referredOrgId: newOrgId },
        });

        if (existingReferral) {
            console.warn(`Organização ${newOrgId} já possui um referenciador`);
            return;
        }

        // Cria o vínculo
        await this.prisma.affiliateReferral.create({
            data: {
                referrerId: referrerProfile.id,
                referredOrgId: newOrgId,
                status: 'ACTIVE',
                commissionCount: 0,
            },
        });
    }

    /**
     * Processa comissão quando uma organização referenciada compra/renova pacote
     */
    async processCommission(organizationId: string) {
        // Busca se esta organização foi referenciada
        const referral = await this.prisma.affiliateReferral.findUnique({
            where: { referredOrgId: organizationId },
            include: {
                referrer: true,
            },
        });

        if (!referral || referral.status !== 'ACTIVE') {
            return; // Não há referenciador ou está inativo
        }

        // Busca assinatura ativa para saber o valor do pacote
        const activeSubscription = await this.prisma.subscription.findFirst({
            where: {
                organizationId,
                status: 'ACTIVE',
            },
            include: {
                package: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!activeSubscription) {
            console.warn(`Tentativa de comissão para ${organizationId} sem assinatura ativa`);
            return;
        }

        // Busca configurações do sistema
        const maxCommissionsConfig = await this.prisma.systemSetting.findUnique({
            where: { key: 'affiliate_max_commissions' },
        });

        const commissionPercentageConfig = await this.prisma.systemSetting.findUnique({
            where: { key: 'affiliate_commission_amount' }, // Mantendo a mesma chave para não perder config, mas agora trata como %
        });

        const maxCommissions = maxCommissionsConfig
            ? parseInt(maxCommissionsConfig.value)
            : 3; // Padrão: 3 vezes

        const commissionPercentage = commissionPercentageConfig
            ? parseFloat(commissionPercentageConfig.value)
            : 10; // Padrão: 10%

        // Verifica se já atingiu o limite
        if (referral.commissionCount >= maxCommissions) {
            console.log(`Limite de comissões atingido para referral ${referral.id}`);
            return;
        }

        // Calcula valor da comissão: Preço Pacote * % / 100
        const packagePrice = activeSubscription.package.price;
        const commissionAmount = packagePrice.mul(commissionPercentage).div(100);

        if (commissionAmount.lte(0)) {
            console.warn(`Comissão calculada é zero ou negativa para ${organizationId}`);
            return;
        }

        // Credita a comissão
        await this.prisma.$transaction([
            // Atualiza saldo do afiliado
            this.prisma.affiliateProfile.update({
                where: { id: referral.referrerId },
                data: {
                    walletBalance: {
                        increment: commissionAmount,
                    },
                    totalEarnings: {
                        increment: commissionAmount,
                    },
                },
            }),
            // Registra a transação
            this.prisma.affiliateTransaction.create({
                data: {
                    affiliateProfileId: referral.referrerId,
                    type: 'COMMISSION_EARNED',
                    amount: commissionAmount,
                    status: 'COMPLETED',
                    description: `Comissão (${commissionPercentage}%) pela assinatura de ${activeSubscription.package.name}`,
                },
            }),
            // Incrementa contador de comissões e total ganho com este indicado
            this.prisma.affiliateReferral.update({
                where: { id: referral.id },
                data: {
                    commissionCount: {
                        increment: 1,
                    },
                    totalAmount: {
                        increment: commissionAmount,
                    },
                },
            }),
        ]);
    }

    /**
     * Obtém estatísticas do afiliado
     */
    async getStats(organizationId: string) {
        const profile = await this.getOrCreateAffiliateProfile(organizationId);

        const referrals = await this.prisma.affiliateReferral.findMany({
            where: { referrerId: profile.id },
            include: {
                referred: {
                    select: {
                        id: true,
                        name: true,
                        createdAt: true,
                        subscriptions: {
                            where: { status: 'ACTIVE' },
                            include: {
                                package: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                            take: 1,
                            orderBy: { createdAt: 'desc' },
                        },
                    },
                },
            },
        });

        const transactions = await this.prisma.affiliateTransaction.findMany({
            where: { affiliateProfileId: profile.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        const bankAccounts = await this.prisma.affiliateBankAccount.findMany({
            where: { affiliateProfileId: profile.id },
            orderBy: { createdAt: 'desc' },
        });

        return {
            profile: {
                referralCode: profile.referralCode,
                walletBalance: profile.walletBalance.toNumber(),
                totalEarnings: profile.totalEarnings.toNumber(),
            },
            referrals: referrals.map((r) => ({
                id: r.id,
                organizationName: r.referred.name,
                organizationId: r.referred.id,
                registeredAt: r.createdAt,
                activePackage: r.referred.subscriptions[0]?.package.name || 'Nenhum',
                commissionCount: r.commissionCount,
                totalAmount: r.totalAmount.toNumber(), // Ensure frontend receives this
                status: r.status,
            })),
            transactions: transactions.map((t) => ({
                id: t.id,
                type: t.type,
                amount: t.amount.toNumber(),
                status: t.status,
                description: t.description,
                createdAt: t.createdAt,
            })),
            bankAccounts,
        };
    }

    /**
     * Lista contas bancárias ativas
     */
    async getBankAccounts(organizationId: string) {
        const profile = await this.getOrCreateAffiliateProfile(organizationId);

        return this.prisma.affiliateBankAccount.findMany({
            where: { affiliateProfileId: profile.id },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Adiciona uma conta bancária
     */
    async addBankAccount(organizationId: string, data: UpdateBankAccountDto) {
        const profile = await this.getOrCreateAffiliateProfile(organizationId);

        return this.prisma.affiliateBankAccount.create({
            data: {
                affiliateProfileId: profile.id,
                bankName: data.bankName,
                accountHolder: data.accountHolder,
                accountNumber: data.accountNumber,
                iban: data.iban,
                swift: data.swift,
            },
        });
    }

    /**
     * Remove uma conta bancária
     */
    async removeBankAccount(organizationId: string, accountId: string) {
        const profile = await this.prisma.affiliateProfile.findUnique({
            where: { organizationId },
        });

        if (!profile) throw new NotFoundException('Perfil não encontrado');

        const account = await this.prisma.affiliateBankAccount.findUnique({
            where: { id: accountId },
        });

        if (!account || account.affiliateProfileId !== profile.id) {
            throw new NotFoundException('Conta bancária não encontrada ou não pertence a este perfil');
        }

        return this.prisma.affiliateBankAccount.delete({
            where: { id: accountId },
        });
    }

    /**
     * Solicita um saque
     */
    async requestWithdrawal(organizationId: string, userId: string, amount: number, bankAccountId: string, password?: string) {
        if (!password) {
            throw new BadRequestException('A senha é obrigatória para confirmar o saque');
        }

        if (!bankAccountId) {
            throw new BadRequestException('Selecione uma conta bancária para receber o saque');
        }

        // Verifica a senha do usuário
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.passwordHash) {
            throw new UnauthorizedException('Usuário não encontrado');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Senha incorreta');
        }

        const profile = await this.getOrCreateAffiliateProfile(organizationId);

        // Validar Conta Bancária
        const bankAccount = await this.prisma.affiliateBankAccount.findUnique({
            where: { id: bankAccountId },
        });

        if (!bankAccount || bankAccount.affiliateProfileId !== profile.id) {
            throw new BadRequestException('Conta bancária inválida');
        }

        const requestedAmount = new Decimal(amount);

        if (profile.walletBalance.lessThan(requestedAmount)) {
            throw new BadRequestException('Saldo insuficiente');
        }

        // Cria a transação de pedido de saque
        const transaction = await this.prisma.affiliateTransaction.create({
            data: {
                affiliateProfileId: profile.id,
                type: 'WITHDRAWAL_REQUEST',
                amount: requestedAmount,
                status: 'PENDING',
                description: `Saque para ${bankAccount.bankName} (${bankAccount.accountNumber})`,
                bankSnapshot: {
                    bankName: bankAccount.bankName,
                    accountHolder: bankAccount.accountHolder,
                    accountNumber: bankAccount.accountNumber,
                    iban: bankAccount.iban,
                    swift: bankAccount.swift,
                } as any, // Cast to any because Prisma Json type
            },
        });

        // Deduz do saldo (reserva)
        await this.prisma.affiliateProfile.update({
            where: { id: profile.id },
            data: {
                walletBalance: {
                    decrement: requestedAmount,
                },
            },
        });

        return transaction;
    }

    /**
     * Admin: Lista todos os pedidos de saque (Pendentes e Aprovados)
     */
    async getPendingWithdrawals() {
        return this.prisma.affiliateTransaction.findMany({
            where: {
                type: 'WITHDRAWAL_REQUEST',
                status: {
                    in: ['PENDING', 'APPROVED']
                },
            },
            include: {
                affiliateProfile: {
                    include: {
                        organization: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Admin: Aprovar saque (Reconhecimento)
     * Muda status para APPROVED. O admin reconheceu e vai processar o pagamento.
     */
    async approveWithdrawal(transactionId: string) {
        const transaction = await this.prisma.affiliateTransaction.findUnique({
            where: { id: transactionId },
        });

        if (!transaction || transaction.type !== 'WITHDRAWAL_REQUEST') {
            throw new NotFoundException('Transação não encontrada');
        }

        if (transaction.status !== 'PENDING') {
            throw new BadRequestException('Transação já foi processada ou não está pendente');
        }

        // Muda status para APPROVED
        await this.prisma.affiliateTransaction.update({
            where: { id: transactionId },
            data: { status: 'APPROVED' },
        });

        return { message: 'Saque aprovado para processamento' };
    }

    /**
     * Admin: Marcar como Pago (Completar)
     * Muda status para COMPLETED e finaliza o fluxo.
     */
    async completeWithdrawal(transactionId: string) {
        const transaction = await this.prisma.affiliateTransaction.findUnique({
            where: { id: transactionId },
        });

        if (!transaction || transaction.type !== 'WITHDRAWAL_REQUEST') {
            throw new NotFoundException('Transação não encontrada');
        }

        if (transaction.status !== 'APPROVED') {
            throw new BadRequestException('Transação precisa estar Aprovada antes de ser paga');
        }

        // Marca como completo
        await this.prisma.affiliateTransaction.update({
            where: { id: transactionId },
            data: { status: 'COMPLETED' },
        });

        // Cria registro de saque completado (Histórico)
        await this.prisma.affiliateTransaction.create({
            data: {
                affiliateProfileId: transaction.affiliateProfileId,
                type: 'WITHDRAWAL_COMPLETED',
                amount: transaction.amount,
                status: 'COMPLETED',
                description: 'Saque pago e finalizado',
            },
        });

        return { message: 'Saque marcado como pago' };
    }

    /**
     * Admin: Rejeitar saque
     */
    async rejectWithdrawal(transactionId: string, reason?: string) {
        const transaction = await this.prisma.affiliateTransaction.findUnique({
            where: { id: transactionId },
        });

        if (!transaction || transaction.type !== 'WITHDRAWAL_REQUEST') {
            throw new NotFoundException('Transação não encontrada');
        }

        if (transaction.status !== 'PENDING' && transaction.status !== 'APPROVED') {
            throw new BadRequestException('Transação já foi processada ou não pode ser rejeitada');
        }

        // Marca como rejeitado
        await this.prisma.affiliateTransaction.update({
            where: { id: transactionId },
            data: { status: 'REJECTED' },
        });

        // Devolve o valor ao saldo
        await this.prisma.affiliateProfile.update({
            where: { id: transaction.affiliateProfileId },
            data: {
                walletBalance: {
                    increment: transaction.amount,
                },
            },
        });

        // Cria registro de rejeição
        await this.prisma.affiliateTransaction.create({
            data: {
                affiliateProfileId: transaction.affiliateProfileId,
                type: 'WITHDRAWAL_REJECTED',
                amount: transaction.amount,
                status: 'REJECTED',
                description: reason || 'Saque rejeitado',
            },
        });

        return { message: 'Saque rejeitado' };
    }

    /**
     * Admin: Estatísticas globais
     */
    async getGlobalStats() {
        const totalAffiliates = await this.prisma.affiliateProfile.count();

        const totalCommissionsPaid = await this.prisma.affiliateTransaction.aggregate({
            where: {
                type: 'COMMISSION_EARNED',
                status: 'COMPLETED',
            },
            _sum: {
                amount: true,
            },
        });

        // Total de empresas ALCANÇADAS (não apenas ativas)
        const totalCompaniesReached = await this.prisma.affiliateReferral.count();

        // Total de saques pendentes
        const pendingWithdrawals = await this.prisma.affiliateTransaction.aggregate({
            where: {
                type: 'WITHDRAWAL_REQUEST',
                status: 'PENDING',
            },
            _sum: {
                amount: true,
            },
        });

        return {
            totalAffiliates,
            totalCompaniesReached, // CORRIGIDO: mostra total alcançado
            totalCommissionsPaid: totalCommissionsPaid._sum.amount?.toNumber() || 0,
            pendingWithdrawalsAmount: pendingWithdrawals._sum.amount?.toNumber() || 0,
        };
    }
}
