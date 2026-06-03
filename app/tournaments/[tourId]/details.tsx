import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
import { useState } from 'react'
// import { getAffiliateCookie, clearAffiliateCookie } from "@/lib/utils/affiliateCookie";
import { Affiliate, EventItem } from '@/app/page'
import { Badge } from '@/components/reui/badge'
import { useFirebaseUser } from '@/lib/firebase/auth'
import { Icon } from '@/lib/icons'
import Image from 'next/image'
import Link from 'next/link'

interface TourDetailProps {
  tourId: string
}
export default function TourDetail({ tourId }: TourDetailProps) {
  const { user } = useFirebaseUser()
  const [step, setStep] = useState('info') // info | register | payment | done
  const [formData, setFormData] = useState({ handicap_index: '', division: '', shirt_size: '' })
  const [paymentData, setPaymentData] = useState({ transaction_reference_no: '', receipt: null })
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [affiliateLoading, setAffiliateLoading] = useState(false)
  const [isLoading, setLoading] = useState(false)
  const [myAffiliate, setMyAffiliate] = useState<Affiliate | null>(null)
  const [existingReg] = useState(false)

  const tournament: EventItem = {
    id: 'id0',
    slots_limit: 400,
    title: 'Viva Hot Babes',
    venue: 'Wack2',
    event_date: 'Thu Jun 04 2026 05:01:10 GMT+0800 (Philippine Standard Time)',
    divisions: ['Championships'],
    registration_fee: 400
  }

  // const { data: tournament, isLoading } = useQuery({
  //   queryKey: ["tournament", tourId],
  //   queryFn: async () => {
  //     const results = await base44.entities.Tournament.filter({ id });
  //     return results[0];
  //   },
  //   enabled: !!id,
  // });

  // const { data: existingReg } = useQuery({
  //   queryKey: ["my-reg", id, user?.id],
  //   queryFn: () => base44.entities.Registration.filter({ tournament_id: id, player_id: user?.id }),
  //   enabled: !!id && !!user?.id,
  //   select: (data) => data?.[0],
  // });

  // const { data: myAffiliate } = useQuery({
  //   queryKey: ["my-affiliate", id, user?.id],
  //   queryFn: () => base44.entities.Affiliate.filter({ tournament_id: id, user_id: user?.id }),
  //   enabled: !!id && !!user?.id,
  //   select: (data) => data?.[0],
  // });

  // const registerMutation = useMutation({
  //   mutationFn: async (data) => {
  //     // Check affiliate cookie
  //     const refCode = getAffiliateCookie();
  //     let affiliateId = null;
  //     if (refCode) {
  //       const affiliates = await base44.entities.Affiliate.filter({ referral_code: refCode, tournament_id: id });
  //       if (affiliates.length > 0) affiliateId = affiliates[0].id;
  //     }

  //     const reg = await base44.entities.Registration.create({
  //       tournament_id: id,
  //       player_id: user.id,
  //       player_name: user.full_name || user.email,
  //       player_email: user.email,
  //       handicap_index: data.handicap_index,
  //       division: data.division,
  //       shirt_size: data.shirt_size,
  //       payment_status: "pending_upload",
  //       affiliate_id: affiliateId,
  //     });
  //     clearAffiliateCookie();
  //     return reg;
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["my-reg", id] });
  //     setStep("payment");
  //   },
  // });

  // const uploadPaymentMutation = useMutation({
  //   mutationFn: async () => {
  //     setUploading(true);
  //     let receiptUrl = "";
  //     if (paymentData.receipt) {
  //       const compressed = await compressImage(paymentData.receipt);
  //       const { file_url } = await base44.integrations.Core.UploadFile({ file: compressed });
  //       receiptUrl = file_url;
  //     }
  //     await base44.entities.Registration.update(existingReg.id, {
  //       receipt_image_url: receiptUrl,
  //       transaction_reference_no: paymentData.transaction_reference_no,
  //       payment_status: "pending_verification",
  //     });
  //     setUploading(false);
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["my-reg", id] });
  //     setStep("done");
  //     toast.success("Payment proof submitted! Awaiting verification.");
  //   },
  //   onError: () => setUploading(false),
  // });

  // const becomeAffiliate = async () => {
  //   setAffiliateLoading(true);
  //   const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  //   await base44.entities.Affiliate.create({
  //     tournament_id: id,
  //     user_id: user.id,
  //     referral_code: code,
  //     clicks_count: 0,
  //     conversions_count: 0,
  //   });
  //   queryClient.invalidateQueries({ queryKey: ["my-affiliate", id] });
  //   setAffiliateLoading(false);
  //   toast.success("You're now an affiliate!");
  // };

  // const copyAffiliateLink = () => {
  //   const link = `${window.location.origin}/tournament/${id}?ref=${myAffiliate.referral_code}`;
  //   navigator.clipboard.writeText(link);
  //   setCopied(true);
  //   setTimeout(() => setCopied(false), 2000);
  // };

  // // Determine initial step
  // useEffect(() => {
  //   if (existingReg) {
  //     if (existingReg.payment_status === "pending_upload") setStep("payment");
  //     else setStep("done");
  //   }
  // }, [existingReg]);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Icon name='spinner-ring' className='w-8 h-8 animate-spin text-primary' />
      </div>
    )
  }

  if (!tourId) {
    return (
      <div className='text-center py-20'>
        <h2 className='font-heading text-2xl font-bold'>Tournament not found</h2>
      </div>
    )
  }

  return (
    <div className='max-w-3xl mx-auto space-y-6'>
      <Link
        href='/'
        className='inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors'>
        <Icon name='arrow-left' className='size-4 opacity-80' /> Back to Tournaments
      </Link>

      {/* Tournament Info Card */}
      <Card className='p-0 mb-4'>
        <CardContent className='p-6 md:p-8'>
          <h1 className='font-heading text-2xl md:text-3xl font-bold mb-4'>{tournament.title}</h1>
          <div className='grid sm:grid-cols-2 gap-4 text-sm'>
            <div className='flex items-center gap-2 text-muted-foreground'>
              <Icon name='tag-chevron' className='w-4 h-4 text-primary' />
              <span>{tournament.venue}</span>
            </div>
            <div className='flex items-center gap-2 text-muted-foreground'>
              <Icon name='squircle' className='w-4 h-4 text-primary' />
              <span>{tournament.event_date ? format(new Date(tournament.event_date), 'MMMM d, yyyy') : 'TBD'}</span>
            </div>
            <div className='flex items-center gap-2 text-muted-foreground'>
              <Icon name='tag-chevron' className='w-4 h-4 text-primary' />
              <span>₱{tournament.registration_fee?.toLocaleString()}</span>
            </div>
            {tournament.slots_limit && (
              <div className='flex items-center gap-2 text-muted-foreground'>
                <Icon name='tag-chevron' className='w-4 h-4 text-primary' />
                <span>{tournament.slots_limit} slots</span>
              </div>
            )}
          </div>
          {tournament.description && <p className='mt-4 text-muted-foreground'>{tournament.description}</p>}
          {tournament.divisions?.length > 0 && (
            <div className='mt-4 flex flex-wrap gap-2'>
              {tournament.divisions.map((d) => (
                <Badge key={d} variant='secondary'>
                  {d}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Affiliate Section */}
      <Card className='p-0 mb-4'>
        <CardContent className='p-6 space-y-4'>
          <div className='flex items-center justify-between flex-wrap gap-3'>
            <div>
              <h3 className='font-semibold flex items-center gap-2'>
                <Icon name='tag-chevron' className='w-4 h-4 text-primary' />
              </h3>
              <p className='text-sm text-muted-foreground mt-1'>Share your link and earn commissions</p>
            </div>
            {!myAffiliate && (
              <Button size='sm' variant='outline' onClick={undefined} disabled={affiliateLoading}>
                {affiliateLoading ? <Icon name='spinner-ring' className='w-4 h-4 animate-spin mr-1' /> : null}
                Become Affiliate
              </Button>
            )}
          </div>

          {/* Commission terms label */}
          {tournament.commission_type && (
            <div className='inline-flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full font-medium'>
              💰{' '}
              {tournament.commission_type === 'fixed_amount'
                ? `Earns ₱${Number(tournament.commission_value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })} per paid signup`
                : `Earns ${tournament.commission_value}% per paid signup`}
            </div>
          )}

          {myAffiliate && (
            <>
              {/* Stats grid */}
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                {[
                  { label: 'Clicks', value: myAffiliate.clicks_count || 0 },
                  { label: 'Registrations', value: myAffiliate.conversions_count || 0 },
                  { label: 'Paid Conversions', value: myAffiliate.total_conversions || 0 },
                  {
                    label: 'Balance Owed',
                    value: `₱${(myAffiliate.total_earnings || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
                    highlight: true
                  }
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-xl p-3 text-center border ${stat.highlight ? 'bg-amber-50 border-amber-200' : 'bg-muted/50'}`}>
                    <p className={`text-lg font-bold ${stat.highlight ? 'text-amber-700' : 'text-foreground'}`}>
                      {stat.value}
                    </p>
                    <p className='text-xs text-muted-foreground mt-0.5'>{stat.label}</p>
                  </div>
                ))}
              </div>
              {/* Copy link */}
              <Button size='sm' variant='outline' onClick={undefined} className='gap-1.5 w-full sm:w-auto'>
                <Icon name={copied ? 'check' : 'copy'} className='w-3.5 h-3.5' />
                {copied ? 'Copied!' : 'Copy Referral Link'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Registration Flow */}
      {step === 'info' && !existingReg && (
        <Card>
          <CardHeader>
            <CardTitle className='font-heading'>Register to Play</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label>UNHS Handicap Index</Label>
              <Input
                value={formData.handicap_index}
                onChange={(e) => setFormData({ ...formData, handicap_index: e.target.value })}
                placeholder='e.g. 14.2'
              />
            </div>
            {tournament.divisions?.length > 0 && (
              <div>
                <Label>Division</Label>
                {/*<Select value={formData.division} onValueChange={(v) => setFormData({ ...formData, division: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select division' />
                  </SelectTrigger>
                  <SelectContent>
                    {tournament.divisions.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>*/}
              </div>
            )}
            <div>
              <Label>Shirt Size</Label>
              {/*<Select value={formData.shirt_size} onValueChange={(v) => setFormData({ ...formData, shirt_size: v })}>
                <SelectTrigger>
                  <SelectValue placeholder='Select size' />
                </SelectTrigger>
                <SelectContent>
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>*/}
            </div>
            {/*<Button
              className='w-full'
              onClick={() => registerMutation.mutate(formData)}
              disabled={registerMutation.isPending}>
              {registerMutation.isPending && <Icon name='spinner-ring' className='w-4 h-4 animate-spin mr-2' />}
              Continue to Payment
            </Button>*/}
          </CardContent>
        </Card>
      )}

      {step === 'payment' && (
        <Card>
          <CardHeader>
            <CardTitle className='font-heading'>Upload Payment Proof</CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Payment details */}
            <div className='bg-muted rounded-xl p-4 space-y-3'>
              <h4 className='font-semibold text-sm'>Payment Instructions</h4>
              <p className='text-sm font-semibold text-primary'>
                Amount: ₱{tournament.registration_fee?.toLocaleString()}
              </p>
              {tournament.bank_details_text && (
                <div>
                  <p className='text-xs font-medium text-muted-foreground mb-1'>Bank Transfer Details</p>
                  <p className='text-sm whitespace-pre-wrap'>{tournament.bank_details_text}</p>
                </div>
              )}
              {tournament.gcash_qr_url && (
                <div>
                  <p className='text-xs font-medium text-muted-foreground mb-2'>GCash / Maya QR</p>
                  <Image
                    width={100}
                    height={100}
                    src={tournament.gcash_qr_url}
                    alt='QR Code'
                    className='w-48 h-48 object-contain rounded-lg border'
                  />
                </div>
              )}
            </div>

            <div>
              <Label>Transaction Reference Number</Label>
              <Input
                value={paymentData.transaction_reference_no}
                onChange={(e) => setPaymentData({ ...paymentData, transaction_reference_no: e.target.value })}
                placeholder='Enter your reference number'
              />
            </div>

            {/*<div>
              <Label>Receipt Screenshot</Label>
              <div className='mt-2'>
                <label className='flex items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors'>
                  <Icon name='tag-chevron' className='w-4 h-4 text-primary' />
                  <span className='text-sm text-muted-foreground'>
                    {paymentData.receipt ? paymentData.receipt?.name : 'Click to upload receipt image'}
                  </span>
                  <input
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={(e) => setPaymentData({ ...paymentData, receipt: e.target.files[0] })}
                  />
                </label>
              </div>
            </div>*/}

            {/*<Button
              className='w-full'
              onClick={() => uploadPaymentMutation.mutate()}
              disabled={uploading || !paymentData.transaction_reference_no || !paymentData.receipt}>
              {uploading && <Loader2 className='w-4 h-4 animate-spin mr-2' />}
              Submit Payment Proof
            </Button>*/}
          </CardContent>
        </Card>
      )}

      {step === 'done' && existingReg && (
        <Card>
          <CardContent className='py-10 text-center space-y-3'>
            <div className='w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto'>
              <Icon name='check' className='w-4 h-4 text-primary' />
            </div>
            <h3 className='font-heading text-xl font-semibold'>Registration Submitted!</h3>
            {/*<Badge
              variant={
                existingReg.payment_status === 'paid'
                  ? 'default'
                  : existingReg.payment_status === 'rejected'
                    ? 'destructive'
                    : 'secondary'
              }>
              {existingReg.payment_status === 'pending_verification' && 'Awaiting Verification'}
              {existingReg.payment_status === 'paid' && 'Payment Confirmed ✓'}
              {existingReg.payment_status === 'rejected' && 'Payment Rejected'}
              {existingReg.payment_status === 'pending_upload' && 'Pending Upload'}
            </Badge>*/}
            {/*{existingReg.payment_status === 'rejected' && (
              <Button variant='outline' onClick={() => setStep('payment')}>
                Re-upload Payment
              </Button>
            )}*/}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
