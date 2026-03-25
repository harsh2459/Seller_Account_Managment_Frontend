import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Plus, Boxes, Search, Pencil, Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { sellersApi } from '../api/sellers';
import { accountsApi } from '../api/accounts';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { extractError, PLATFORM_LABELS, PLATFORM_COLORS, STATUS_COLORS, formatDate } from '../lib/utils';

const PLATFORMS = ['amazon', 'flipkart', 'meesho'];

const CRED_FIELDS = {
  amazon: [
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'password', label: 'Password', type: 'password', required: true },
    { name: 'sellerId', label: 'Seller ID', required: true },
    { name: 'marketplaceId', label: 'Marketplace ID' },
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
      <Button variant="secondary" onClick={handleReveal} className="text-xs">
        {isFetching ? <Spinner size="sm" /> : reveal ? <EyeOff size={14} /> : <Eye size={14} />}
        {reveal ? 'Hide' : 'Reveal'} Credentials
      </Button>
      {reveal && data?.credentials && (
        <motion.div
          className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1.5"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          {Object.entries(data.credentials).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <span className="text-xs text-slate-400 capitalize">{k}</span>
              <span className="text-xs text-slate-700 font-mono break-all">{String(v)}</span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function AccountForm({ sellers, defaultValues, onSubmit, loading, isEdit }) {
  const [platform, setPlatform] = useState(defaultValues?.platform ?? '');

  const schema = z.object({
    seller_id: z.string().min(1, 'Seller is required'),
    platform: z.enum(['amazon', 'flipkart', 'meesho']),
    nickname: z.string().optional(),
    credentials: z.record(z.string()).optional(),
    status: z.enum(['active', 'inactive', 'error']).optional(),
  });

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {},
  });

  const activePlatform = watch('platform') || platform;
  const fields = CRED_FIELDS[activePlatform] ?? [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select label="Seller" options={sellers?.map((s) => ({ value: s.id, label: s.name })) ?? []} placeholder="Select seller..." error={errors.seller_id?.message} disabled={isEdit} {...register('seller_id')} />
      <Select label="Platform" options={PLATFORMS.map((p) => ({ value: p, label: PLATFORM_LABELS[p] }))} placeholder="Select platform..." error={errors.platform?.message} disabled={isEdit} {...register('platform', { onChange: (e) => setPlatform(e.target.value) })} />
      <Input label="Nickname (optional)" placeholder="e.g. Main Account" {...register('nickname')} />

      {fields.length > 0 && (
        <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {PLATFORM_LABELS[activePlatform]} Credentials
          </p>
          {fields.map((f) => (
            <Input key={f.name} label={f.label + (f.required ? ' *' : '')} type={f.type || 'text'} placeholder={f.placeholder || f.label} {...register(`credentials.${f.name}`)} />
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

export function AccountsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [deleteAccount, setDeleteAccount] = useState(null);

  const { data: sellersData } = useQuery({
    queryKey: ['sellers-all'],
    queryFn: () => sellersApi.list({ limit: 100 }),
    select: (res) => res.data.data?.sellers ?? [],
  });

  const { data: accountsList, isLoading } = useQuery({
    queryKey: ['all-accounts'],
    queryFn: async () => {
      if (!sellersData?.length) return [];
      const all = await Promise.all(
        sellersData.map((s) =>
          accountsApi.list(s.id).then((r) =>
            (r.data.data?.accounts ?? []).map((a) => ({ ...a, sellerName: s.name }))
          )
        )
      );
      return all.flat();
    },
    enabled: !!sellersData?.length,
  });

  const createMut = useMutation({
    mutationFn: ({ seller_id, ...rest }) => accountsApi.create(seller_id, rest),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-accounts'] }); toast.success('Account created'); setCreateOpen(false); },
    onError: (err) => toast.error(extractError(err)),
  });

  const updateMut = useMutation({
    mutationFn: ({ sellerId, id, ...rest }) => accountsApi.update(sellerId, id, rest),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-accounts'] }); toast.success('Account updated'); setEditAccount(null); },
    onError: (err) => toast.error(extractError(err)),
  });

  const deleteMut = useMutation({
    mutationFn: ({ sellerId, id }) => accountsApi.remove(sellerId, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-accounts'] }); toast.success('Account deleted'); setDeleteAccount(null); },
    onError: (err) => toast.error(extractError(err)),
  });

  const filtered = (accountsList ?? []).filter(
    (a) => !search || a.sellerName?.toLowerCase().includes(search.toLowerCase()) || a.platform?.toLowerCase().includes(search.toLowerCase()) || a.nickname?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Accounts"
        subtitle={`${filtered.length} accounts across all sellers`}
        action={<Button onClick={() => setCreateOpen(true)}><Plus size={16} /> New Account</Button>}
      />

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input-base pl-9" placeholder="Search accounts..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Boxes} title="No platform accounts" description="Connect your first seller account" action={<Button onClick={() => setCreateOpen(true)}><Plus size={16} /> New Account</Button>} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((account, i) => (
            <motion.div
              key={account.id}
              className="card p-5 space-y-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${PLATFORM_COLORS[account.platform]}`}>
                    {PLATFORM_LABELS[account.platform]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{account.nickname || account.platform_email || 'Account'}</p>
                    <p className="text-xs text-slate-400">{account.sellerName}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditAccount(account)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteAccount(account)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                    <Trash2 size={14} />
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
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Platform Account" size="lg">
        <AccountForm sellers={sellersData} onSubmit={(v) => createMut.mutate(v)} loading={createMut.isPending} />
      </Modal>

      <Modal open={!!editAccount} onClose={() => setEditAccount(null)} title="Edit Account" size="lg">
        {editAccount && (
          <AccountForm isEdit sellers={sellersData}
            defaultValues={{ seller_id: editAccount.seller_id, platform: editAccount.platform, nickname: editAccount.nickname, status: editAccount.status }}
            onSubmit={(v) => updateMut.mutate({ sellerId: editAccount.seller_id, id: editAccount.id, ...v })}
            loading={updateMut.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteAccount}
        onClose={() => setDeleteAccount(null)}
        onConfirm={() => deleteMut.mutate({ sellerId: deleteAccount?.seller_id, id: deleteAccount?.id })}
        loading={deleteMut.isPending}
        title="Delete Account"
        message={`Remove ${PLATFORM_LABELS[deleteAccount?.platform]} account from "${deleteAccount?.sellerName}"?`}
      />
    </div>
  );
}
