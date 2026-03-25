import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    ArrowLeft, Plus, Store, Eye, EyeOff, RefreshCw,
    Pencil, Trash2, ShoppingBag, ShoppingCart, Package,
} from 'lucide-react';
import { sellersApi } from '../api/sellers';
import { accountsApi } from '../api/accounts';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { useForm } from 'react-hook-form';
import { extractError, PLATFORM_LABELS, PLATFORM_COLORS, STATUS_COLORS, formatDate } from '../lib/utils';

const PLATFORMS = ['amazon', 'flipkart', 'meesho'];

const PLATFORM_ICONS = {
    amazon: ShoppingCart,
    flipkart: ShoppingBag,
    meesho: Package,
};

const PLATFORM_BG = {
    amazon: 'from-orange-50 to-amber-50 border-orange-200',
    flipkart: 'from-yellow-50 to-lime-50 border-yellow-200',
    meesho: 'from-pink-50 to-rose-50 border-pink-200',
};

const CRED_FIELDS = {
    amazon: [
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Password', type: 'password', required: true },
        { name: 'sellerId', label: 'Seller ID', required: true },
        { name: 'marketplaceId', label: 'Marketplace ID', placeholder: 'A21TJRUUN4KGV' },
        { name: 'accessKeyId', label: 'LWA Client ID', placeholder: 'amzn1.application-oa2-client.xxx' },
        { name: 'secretAccessKey', label: 'LWA Client Secret', type: 'password', placeholder: 'amzn1.oa2-cs.v1.xxx' },
        { name: 'refreshToken', label: 'Refresh Token', type: 'password', placeholder: 'Atzr|IwEB...' },
        { name: 'region', label: 'Region', placeholder: 'eu-west-1' },
    ],
    flipkart: [
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Password', type: 'password', required: true },
        { name: 'apiKey', label: 'API Key' },
        { name: 'apiSecret', label: 'API Secret', type: 'password' },
    ],
    meesho: [
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Password', type: 'password', required: true },
        { name: 'supplierId', label: 'Supplier ID' },
        { name: 'phone', label: 'Phone' },
    ],
};

function CredentialReveal({ sellerId, accountId }) {
    const [reveal, setReveal] = useState(false);
    const { data, isFetching, refetch } = useQuery({
        queryKey: ['account-credentials', sellerId, accountId],
        queryFn: () => accountsApi.credentials(sellerId, accountId),
        select: (res) => res.data.data,
        enabled: false,
    });

    const handleReveal = async () => {
        if (!reveal) await refetch();
        setReveal((r) => !r);
    };

    return (
        <div className="space-y-2">
            <button
                onClick={handleReveal}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
                {isFetching ? <Spinner size="sm" /> : reveal ? <EyeOff size={12} /> : <Eye size={12} />}
                {reveal ? 'Hide' : 'Show'} credentials
            </button>
            <AnimatePresence>
                {reveal && data?.credentials && (
                    <motion.div
                        className="rounded-lg bg-slate-900 p-3 space-y-1.5"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        {Object.entries(data.credentials).map(([k, v]) => (
                            <div key={k} className="flex justify-between gap-4">
                                <span className="text-xs text-slate-400 capitalize">{k}</span>
                                <span className="text-xs text-slate-200 font-mono break-all">{String(v)}</span>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function AccountForm({ defaultValues, onSubmit, loading, isEdit }) {
    const { register, handleSubmit, watch, formState: { errors }, setError } = useForm({
        defaultValues: defaultValues ?? {},
    });

    const activePlatform = watch('platform');
    const fields = CRED_FIELDS[activePlatform] ?? [];

    const handleFormSubmit = (data) => {
        if (!data.platform) {
            setError('platform', { message: 'Please select a platform' });
            return;
        }
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <Select
                label="Platform"
                options={PLATFORMS.map((p) => ({ value: p, label: PLATFORM_LABELS[p] }))}
                placeholder="Select platform..."
                error={errors.platform?.message}
                disabled={isEdit}
                {...register('platform')}
            />
            <Input label="Nickname (optional)" placeholder="e.g. Main Account" {...register('nickname')} />

            {fields.length > 0 && (
                <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {PLATFORM_LABELS[activePlatform]} Credentials
                    </p>
                    {fields.map((f) => (
                        <Input key={f.name} label={f.label + (f.required ? ' *' : '')} type={f.type || 'text'} placeholder={f.label} {...register(`credentials.${f.name}`)} />
                    ))}
                </div>
            )}

            {isEdit && (
                <Select label="Status" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'error', label: 'Error' }]} {...register('status')} />
            )}

            <div className="flex justify-end pt-2">
                <Button type="submit" loading={loading}>
                    {isEdit ? 'Save Changes' : 'Create Account'}
                </Button>
            </div>
        </form>
    );
}

function AccountCard({ account, onEdit, onDelete }) {
    const PlatformIcon = PLATFORM_ICONS[account.platform] ?? ShoppingBag;

    return (
        <motion.div
            className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4"
            style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border bg-gradient-to-br ${PLATFORM_BG[account.platform]}`}>
                        <PlatformIcon size={18} className={account.platform === 'amazon' ? 'text-orange-600' : account.platform === 'flipkart' ? 'text-yellow-600' : 'text-pink-600'} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-800">
                            {account.nickname || account.platform_email || PLATFORM_LABELS[account.platform]}
                        </p>
                        {account.platform_email && (
                            <p className="text-xs text-slate-400 mt-0.5">{account.platform_email}</p>
                        )}
                    </div>
                </div>
                <div className="flex gap-1 shrink-0">
                    <button onClick={() => onEdit(account)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                        <Pencil size={13} />
                    </button>
                    <button onClick={() => onDelete(account)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <Badge className={STATUS_COLORS[account.status]}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {account.status}
                </Badge>
                {account.last_synced_at && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                        <RefreshCw size={11} /> {formatDate(account.last_synced_at)}
                    </span>
                )}
            </div>

            <CredentialReveal sellerId={account.seller_id} accountId={account.id} />
        </motion.div>
    );
}

export function SellerDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [createOpen, setCreateOpen] = useState(false);
    const [editAccount, setEditAccount] = useState(null);
    const [deleteAccount, setDeleteAccount] = useState(null);

    const { data: seller, isLoading: sellerLoading } = useQuery({
        queryKey: ['seller', id],
        queryFn: () => sellersApi.get(id),
        select: (res) => res.data.data?.seller ?? res.data.data,
    });

    const { data: accounts = [], isLoading: accountsLoading } = useQuery({
        queryKey: ['seller-accounts', id],
        queryFn: () => accountsApi.list(id),
        select: (res) => res.data.data?.accounts ?? [],
    });

    const createMut = useMutation({
        mutationFn: (v) => accountsApi.create(id, v),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['seller-accounts', id] }); toast.success('Account created'); setCreateOpen(false); },
        onError: (err) => toast.error(extractError(err)),
    });

    const updateMut = useMutation({
        mutationFn: ({ accountId, ...rest }) => accountsApi.update(id, accountId, rest),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['seller-accounts', id] }); toast.success('Account updated'); setEditAccount(null); },
        onError: (err) => toast.error(extractError(err)),
    });

    const deleteMut = useMutation({
        mutationFn: (accountId) => accountsApi.remove(id, accountId),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['seller-accounts', id] }); toast.success('Account deleted'); setDeleteAccount(null); },
        onError: (err) => toast.error(extractError(err)),
    });

    // Group accounts by platform
    const grouped = PLATFORMS.reduce((acc, p) => {
        acc[p] = accounts.filter((a) => a.platform === p);
        return acc;
    }, {});

    const isLoading = sellerLoading || accountsLoading;

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                className="flex items-center gap-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button
                    onClick={() => navigate('/sellers')}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="flex items-center gap-3">
                    {sellerLoading ? (
                        <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse" />
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
                            {seller?.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                    )}
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">{seller?.name ?? '...'}</h1>
                        <p className="text-sm text-slate-400">
                            {accounts.length} platform account{accounts.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <div className="ml-auto">
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus size={16} /> Add Account
                    </Button>
                </div>
            </motion.div>

            {isLoading ? (
                <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : accounts.length === 0 ? (
                <div className="card p-12 flex flex-col items-center gap-4 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Store size={24} className="text-slate-400" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-700">No platform accounts</p>
                        <p className="text-sm text-slate-400 mt-1">Connect Amazon, Flipkart or Meesho to get started</p>
                    </div>
                    <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> Add Account</Button>
                </div>
            ) : (
                <div className="space-y-8">
                    {PLATFORMS.map((platform) => {
                        const platformAccounts = grouped[platform];
                        if (platformAccounts.length === 0) return null;
                        const PlatformIcon = PLATFORM_ICONS[platform];
                        return (
                            <motion.div
                                key={platform}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-3"
                            >
                                {/* Platform header */}
                                <div className="flex items-center gap-2.5">
                                    <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-sm font-semibold bg-gradient-to-br ${PLATFORM_BG[platform]}`}>
                                        <PlatformIcon size={15} className={platform === 'amazon' ? 'text-orange-600' : platform === 'flipkart' ? 'text-yellow-600' : 'text-pink-600'} />
                                        <span className={PLATFORM_COLORS[platform].split(' ')[0]}>
                                            {PLATFORM_LABELS[platform]}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-400">{platformAccounts.length} account{platformAccounts.length !== 1 ? 's' : ''}</span>
                                </div>

                                {/* Account cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {platformAccounts.map((account) => (
                                        <AccountCard
                                            key={account.id}
                                            account={account}
                                            onEdit={setEditAccount}
                                            onDelete={setDeleteAccount}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Platform Account" size="lg">
                <AccountForm sellerId={id} onSubmit={(v) => createMut.mutate(v)} loading={createMut.isPending} />
            </Modal>

            <Modal open={!!editAccount} onClose={() => setEditAccount(null)} title="Edit Account" size="lg">
                {editAccount && (
                    <AccountForm
                        isEdit
                        sellerId={id}
                        defaultValues={{ platform: editAccount.platform, nickname: editAccount.nickname, status: editAccount.status }}
                        onSubmit={(v) => updateMut.mutate({ accountId: editAccount.id, ...v })}
                        loading={updateMut.isPending}
                    />
                )}
            </Modal>

            <ConfirmDialog
                open={!!deleteAccount}
                onClose={() => setDeleteAccount(null)}
                onConfirm={() => deleteMut.mutate(deleteAccount?.id)}
                loading={deleteMut.isPending}
                title="Delete Account"
                message={`Remove ${PLATFORM_LABELS[deleteAccount?.platform]} account "${deleteAccount?.nickname || deleteAccount?.platform_email || 'this account'}" from ${seller?.name}?`}
            />
        </div>
    );
}
