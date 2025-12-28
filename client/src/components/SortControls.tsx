import type { SortOption } from '../types/menu.types';

interface SortControlsProps {
	sortBy: SortOption;
	sortOrder: 'asc' | 'desc';
	onSortChange: (sortBy: SortOption, order: 'asc' | 'desc') => void;
	className?: string;
}

const sortOptions: { value: SortOption; label: string; icon: string }[] = [
	{ value: 'name', label: 'Name', icon: '🔤' },
	{ value: 'price', label: 'Price', icon: '💰' },
	{ value: 'popularity', label: 'Popularity', icon: '⭐' },
	{ value: 'newest', label: 'Newest', icon: '🆕' },
];

export function SortControls({ 
	sortBy, 
	sortOrder, 
	onSortChange, 
	className = "" 
}: SortControlsProps) {
	return (
		<div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
			{/* Sort by dropdown */}
			<div className="flex-1">
				<label className="block text-sm font-medium text-gray-700 mb-1">
					Sort by
				</label>
				<select
					value={sortBy}
					onChange={(e) => onSortChange(e.target.value as SortOption, sortOrder)}
					className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-xl bg-white"
				>
					{sortOptions.map((option) => (
						<option key={option.value} value={option.value}>
							{option.icon} {option.label}
						</option>
					))}
				</select>
			</div>

			{/* Sort order buttons */}
			<div className="flex-1">
				<label className="block text-sm font-medium text-gray-700 mb-1">
					Order
				</label>
				<div className="flex rounded-xl border border-gray-300 overflow-hidden">
					<button
						onClick={() => onSortChange(sortBy, 'asc')}
						className={`flex-1 px-3 py-2 text-sm font-medium transition-all duration-200 ${
							sortOrder === 'asc'
								? 'bg-orange-500 text-white'
								: 'bg-white text-gray-700 hover:bg-orange-50'
						}`}
					>
						↑ Ascending
					</button>
					<button
						onClick={() => onSortChange(sortBy, 'desc')}
						className={`flex-1 px-3 py-2 text-sm font-medium border-l border-gray-300 transition-all duration-200 ${
							sortOrder === 'desc'
								? 'bg-orange-500 text-white'
								: 'bg-white text-gray-700 hover:bg-orange-50'
						}`}
					>
						↓ Descending
					</button>
				</div>
			</div>
		</div>
	);
}

interface SortButtonsProps extends SortControlsProps {
	compact?: boolean;
}

export function SortButtons({ 
	sortBy, 
	sortOrder, 
	onSortChange, 
	compact = false,
	className = "" 
}: SortButtonsProps) {
	return (
		<div className={`flex flex-wrap gap-2 ${className}`}>
			{sortOptions.map((option) => (
				<button
					key={option.value}
					onClick={() => {
						// Toggle order if same sort option is clicked
						const newOrder = sortBy === option.value && sortOrder === 'asc' ? 'desc' : 'asc';
						onSortChange(option.value, newOrder);
					}}
					className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
						sortBy === option.value
							? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
							: 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300 hover:bg-orange-50'
					}`}
				>
					<span>{option.icon}</span>
					{!compact && <span>{option.label}</span>}
					{sortBy === option.value && (
						<span className="text-xs">
							{sortOrder === 'asc' ? '↑' : '↓'}
						</span>
					)}
				</button>
			))}
		</div>
	);
}