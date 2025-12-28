import { useMenuSearch } from '../hooks/useMenu';

interface SearchBarProps {
	onSearch: (query: string) => void;
	placeholder?: string;
	className?: string;
}

export function SearchBar({ onSearch, placeholder = "Search menu items...", className = "" }: SearchBarProps) {
	const { searchQuery, setSearchQuery } = useMenuSearch(onSearch);

	return (
		<div className={`relative ${className}`}>
			<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
				<svg
					className="h-5 w-5 text-gray-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			</div>
			<input
				type="text"
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all duration-200"
				placeholder={placeholder}
			/>
			{searchQuery && (
				<button
					type="button"
					onClick={() => setSearchQuery('')}
					className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
				>
					<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			)}
		</div>
	);
}