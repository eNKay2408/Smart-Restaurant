import { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { tableService } from '../services/tableService';
import type { QRCodeData, TableInfo } from '../types/menu.types';

/**
 * Custom hook for handling QR code URL parameters and table information
 * Usage: const { tableInfo, isValidTable, error } = useQRTable();
 */
export function useQRTable() {
	const [searchParams] = useSearchParams();
	const location = useLocation();
	const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
	const [isValidTable, setIsValidTable] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const extractTableInfo = async () => {
			setIsLoading(true);
			setError(null);

			try {
				// Method 1: Extract QR token from URL
				const qrToken = searchParams.get('token');
				
				if (qrToken) {
					try {
						const response = await tableService.verifyQRCode(qrToken);
						
						if (response.success) {
							const tableData: TableInfo = {
								tableId: response.data._id,
								restaurantId: response.data.restaurantId,
								tableNumber: response.data.number,
								area: 'Main Dining' // Default area if not provided
							};

							setTableInfo(tableData);
							setIsValidTable(true);
							setError(null);
							return;
						} else {
							throw new Error(response.message || 'Invalid QR token');
						}
					} catch (tokenError: any) {
						setError('Invalid or expired QR code');
						setIsValidTable(false);
						setTableInfo(null);
						return;
					}
				}

				// Method 2: Extract from URL search params (legacy support)
				const tableId = searchParams.get('table_id') || searchParams.get('tableId');
				const restaurantId = searchParams.get('restaurant_id') || searchParams.get('restaurantId');
				const tableNumber = searchParams.get('table_number') || searchParams.get('tableNumber');
				const area = searchParams.get('area');

				if (tableId && restaurantId) {
					try {
						// Verify table exists in backend
						const response = await getTableById(tableId);
						
						if (response.success) {
							const tableData: TableInfo = {
								tableId,
								restaurantId,
								tableNumber: tableNumber ? parseInt(tableNumber) : parseInt(response.data.tableNumber),
								area: response.data.location || area
							};

							setTableInfo(tableData);
							setIsValidTable(true);
							setError(null);
							return;
						} else {
							throw new Error('Table not found');
						}
					} catch (tableError: any) {
						setError('Table not found or inactive');
						setIsValidTable(false);
						setTableInfo(null);
						return;
					}
				}
				
				// Method 3: Extract from URL path (e.g., /menu/table/123)
				const pathSegments = location.pathname.split('/');
				const tableIndex = pathSegments.indexOf('table');
				
				if (tableIndex !== -1 && pathSegments[tableIndex + 1]) {
					const pathTableId = pathSegments[tableIndex + 1];
					
					try {
						const response = await getTableById(pathTableId);
						
						if (response.success) {
							const tableData: TableInfo = {
								tableId: pathTableId,
								restaurantId: response.data.restaurantId,
								tableNumber: parseInt(response.data.tableNumber)
							};

							setTableInfo(tableData);
							setIsValidTable(true);
							setError(null);
							return;
						}
					} catch (pathError: any) {
						// Continue to other methods
					}
				}
				
				// Method 4: Check for encoded QR data in URL fragment
				if (location.hash) {
					try {
						const hashData = location.hash.substring(1); // Remove #
						const decodedData = decodeURIComponent(hashData);
						const qrData: QRCodeData = JSON.parse(decodedData);
						
						if (qrData.tableId && qrData.restaurantId) {
							// Verify with backend
							const response = await getTableById(qrData.tableId);
							
							if (response.success) {
								const tableData: TableInfo = {
									tableId: qrData.tableId,
									restaurantId: qrData.restaurantId,
									tableNumber: qrData.tableNumber || parseInt(response.data.tableNumber)
								};

								setTableInfo(tableData);
								setIsValidTable(true);
								setError(null);
								return;
							}
						} else {
							throw new Error('Invalid QR data structure');
						}
					} catch (parseError) {
						setError('Invalid QR code data format');
						setIsValidTable(false);
						setTableInfo(null);
						return;
					}
				}
				
				// No table information found - this might be normal for non-QR access
				setTableInfo(null);
				setIsValidTable(false);
				setError(null); // Don't treat this as an error
				
			} catch (err: any) {
				setError('Failed to process table information');
				setIsValidTable(false);
				setTableInfo(null);
				console.error('QR Table error:', err);
			} finally {
				setIsLoading(false);
			}
		};

		extractTableInfo();
	}, [searchParams, location]);

	// Helper function to generate QR code URL for testing
	const generateQRUrl = (tableId: string, restaurantId: string, tableNumber?: number): string => {
		const baseUrl = window.location.origin;
		const params = new URLSearchParams({
			table_id: tableId,
			restaurant_id: restaurantId,
			...(tableNumber && { table_number: tableNumber.toString() })
		});
		return `${baseUrl}/menu?${params.toString()}`;
	};

	// Helper function to clear table info (for logout or reset)
	const clearTableInfo = () => {
		setTableInfo(null);
		setIsValidTable(false);
		setError(null);
	};

	return {
		tableInfo,
		isValidTable,
		isLoading,
		error,
		generateQRUrl,
		clearTableInfo
	};
}

/**
 * Hook for extracting URL parameters in a more general way
 */
export function useURLParams() {
	const [searchParams, setSearchParams] = useSearchParams();
	
	const getParam = (key: string): string | null => {
		return searchParams.get(key);
	};
	
	const setParam = (key: string, value: string) => {
		const newParams = new URLSearchParams(searchParams);
		newParams.set(key, value);
		setSearchParams(newParams);
	};
	
	const removeParam = (key: string) => {
		const newParams = new URLSearchParams(searchParams);
		newParams.delete(key);
		setSearchParams(newParams);
	};
	
	const getAllParams = (): Record<string, string> => {
		const params: Record<string, string> = {};
		searchParams.forEach((value, key) => {
			params[key] = value;
		});
		return params;
	};

	return {
		getParam,
		setParam,
		removeParam,
		getAllParams,
		searchParams
	};
}