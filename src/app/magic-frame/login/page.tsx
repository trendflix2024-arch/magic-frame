import { redirect } from 'next/navigation';
import { isMarketSource } from '@/lib/magic-frame-sources';

// 가정의 달(행번) 로그인은 종료됐다. 예전 주소로 들어오면 구매자 로그인으로 넘긴다.
// 관리자는 /magic-frame/admin 에서 로그인한다.
export default function LegacyLoginRedirect({ searchParams }: { searchParams: { source?: string } }) {
    const source = searchParams?.source;
    redirect(isMarketSource(source) ? `/magic-frame/market-login?source=${encodeURIComponent(source)}` : '/magic-frame/market-login');
}
