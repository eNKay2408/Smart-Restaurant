import type { MenuCategory } from '../types/menu.types';

interface CategoryFilterProps {
	categories: MenuCategory[];
	selectedCategory: string | null;
	onCategorySelect: (categoryId: string | null) => void;
	className?: string;
}

export function CategoryFilter({ 
	categories, 
	selectedCategory, 
	onCategorySelect, 
	className = "" 
}: CategoryFilterProps) {
	return (
		<div className={`${className}`}>
			<div className="flex flex-wrap gap-2">
				{/* All categories button */}
				<button
					onClick={() => onCategorySelect(null)}
					className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
						selectedCategory === null
							? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
							: 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300 hover:bg-orange-50'
					}`}
				>
					🍽️ All Items
				</button>

				{/* Category buttons */}
				{categories.map((category) => (
					<button
						key={category._id}
						onClick={() => onCategorySelect(category._id)}
						className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
							selectedCategory === category._id
								? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
								: 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300 hover:bg-orange-50'
						}`}
					>
						{category.name}
					</button>
				))}
			</div>
		</div>
	);
}

interface CategoryDropdownProps extends CategoryFilterProps {
	label?: string;
}

export function CategoryDropdown({ 
	categories, 
	selectedCategory, 
	onCategorySelect, 
	label = "Category",
	className = "" 
}: CategoryDropdownProps) {
	return (
		<div className={`relative ${className}`}>
			<label className="block text-sm font-medium text-gray-700 mb-1">
				{label}
			</label>
			<select
				value={selectedCategory || ''}
				onChange={(e) => onCategorySelect(e.target.value || null)}
				className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-xl bg-white"
			>
				<option value="">🍽️ All Items</option>
				{categories.map((category) => (
					<option key={category._id} value={category._id}>
						{category.name}
					</option>
				))}
			</select>
		</div>
	);
}