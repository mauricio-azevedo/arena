import { BottomNav } from '@/components/bottom-nav';

type AppShellProps = {
	children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
	return (
		<main className="min-h-screen bg-background px-4 pb-24 pt-6">
			<div className="mx-auto max-w-md">{children}</div>
			<BottomNav />
		</main>
	);
}