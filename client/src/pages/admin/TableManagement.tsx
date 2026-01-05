import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { tableService } from '../../services/tableService';

interface Table {
    _id: string;
    tableNumber: string;
    capacity: number;
    location?: string;
    restaurantId: string;
    qrCode: {
        token: string;
        imageUrl?: string;
        generatedAt: Date;
    };
    status: 'active' | 'inactive' | 'occupied' | 'reserved';
    currentSessionId?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

const AdminTableManagement: React.FC = () => {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTable, setNewTable] = useState({ capacity: 4, tableNumber: '1', location: '' });

    // Fetch tables from backend
    const fetchTables = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await tableService.getTables();
            if (response.success) {
                setTables(response.data);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch tables');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTables();
    }, []);

    const handleAddTable = async () => {
        if (!newTable.tableNumber) return;

        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            await tableService.createTable({
                tableNumber: newTable.tableNumber,
                capacity: newTable.capacity,
                location: newTable.location,
                restaurantId: user.restaurantId || 'default-restaurant'
            });

            // Reset form and refresh tables
            setNewTable({ capacity: 4, tableNumber: '1', location: '' });
            setShowAddForm(false);
            await fetchTables();
        } catch (err: any) {
            setError(err.message || 'Failed to create table');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async (tableId: string) => {
        try {
            setLoading(true);
            const table = tables.find(t => t._id === tableId);
            if (table) {
                await tableService.updateTable(tableId, {
                    isActive: !table.isActive
                });
                await fetchTables();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to update table status');
        } finally {
            setLoading(false);
        }
    };

    const regenerateQRCode = async (tableId: string) => {
        try {
            setLoading(true);
            await tableService.regenerateQRCode(tableId);
            await fetchTables();
            alert(`New QR code generated successfully`);
        } catch (err: any) {
            setError(err.message || 'Failed to regenerate QR code');
        } finally {
            setLoading(false);
        }
    };

    const downloadQRCode = async (table: Table, format: 'png' | 'pdf') => {
        try {
            // Use the QR code image from backend if available
            if (table.qrCode.imageUrl) {
                const link = document.createElement('a');
                link.href = table.qrCode.imageUrl;
                link.download = `table-${table.tableNumber}-qr-code.${format}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                // Generate QR code on client side
                const qrCodeDataUrl = await tableService.generateQRCode(table);
                const link = document.createElement('a');
                link.href = qrCodeDataUrl;
                link.download = `table-${table.tableNumber}-qr-code.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            alert(`Failed to download QR code: ${error}`);
        }
    };

    const printQRCode = async (table: Table) => {
        try {
            let qrDataUrl = table.qrCode.imageUrl;

            // If no image URL from backend, generate on client
            if (!qrDataUrl) {
                qrDataUrl = await tableService.generateQRCode(table);
            }

            // Create print window
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Table ${table.tableNumber} QR Code</title>
                            <style>
                                body { text-align: center; font-family: Arial, sans-serif; }
                                .qr-container { margin: 50px auto; }
                                h1 { margin-bottom: 20px; }
                            </style>
                        </head>
                        <body>
                            <div class="qr-container">
                                <h1>Table ${table.tableNumber}</h1>
                                <img src="${qrDataUrl}" alt="QR Code for Table ${table.tableNumber}" />
                                <p>Capacity: ${table.capacity} people</p>
                                <p>Scan to view menu</p>
                            </div>
                        </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.print();
            }
        } catch (error) {
            alert(`Failed to print QR code: ${error}`);
        }
    };

    const getStatusBadge = (isActive: boolean) => {
        return isActive
            ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">🟢 Active</span>
            : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">🔴 Inactive</span>;
    };

    const QRCodePreview = ({ table }: { table: Table }) => {
        const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
        const [generating, setGenerating] = useState(false);

        useEffect(() => {
            const generateQRCodeImage = async () => {
                try {
                    setGenerating(true);
                    // Use backend image if available
                    if (table.qrCode.imageUrl) {
                        setQrCodeUrl(table.qrCode.imageUrl);
                    } else {
                        // Generate on client side
                        const qrDataUrl = await tableService.generateQRCode(table);
                        setQrCodeUrl(qrDataUrl);
                    }
                } catch (error) {
                    console.error('Failed to generate QR code:', error);
                } finally {
                    setGenerating(false);
                }
            };

            if (table.qrCode?.token) {
                generateQRCodeImage();
            }
        }, [table]);

        return (
            <div className="bg-white border-2 border-gray-200 p-4 rounded-lg text-center">
                {/* QR Code Display */}
                <div className="w-32 h-32 mx-auto mb-4">
                    {generating ? (
                        <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <div className="text-sm text-gray-500 mt-2">Generating...</div>
                            </div>
                        </div>
                    ) : qrCodeUrl ? (
                        <img src={qrCodeUrl} alt={`QR Code for Table ${table.tableNumber}`} className="w-full h-full" />
                    ) : (
                        <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-sm text-gray-500">No QR Code</div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <p className="font-semibold text-gray-900">Table #{table.tableNumber}</p>
                    <p className="text-sm text-gray-600">Capacity: {table.capacity} people</p>
                    {table.location && <p className="text-sm text-gray-600">Location: {table.location}</p>}
                    <p className="text-xs text-gray-500">QR Token: {table.qrCode.token?.substring(0, 10)}...</p>
                    <p className="text-xs text-gray-500">Status: {table.isActive ? 'Active' : 'Inactive'}</p>

                    <div className="flex flex-col space-y-2 mt-4">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => downloadQRCode(table, 'png')}
                                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                📥 Download PNG
                            </button>
                            <button
                                onClick={() => downloadQRCode(table, 'pdf')}
                                className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                            >
                                📥 Download PDF
                            </button>
                        </div>
                        <button
                            onClick={() => printQRCode(table)}
                            className="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            🖨️ Print QR Code
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Table Management</h1>
                        <p className="text-gray-600 mt-1">Manage restaurant tables and generate QR codes</p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Table
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Loading tables...</span>
                    </div>
                )}

                {/* Add Table Form */}
                {showAddForm && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Table</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Table Number
                                </label>
                                <input
                                    type="text"
                                    value={newTable.tableNumber}
                                    onChange={(e) => setNewTable(prev => ({ ...prev, tableNumber: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., 1, A1, VIP-1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Capacity
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newTable.capacity}
                                    onChange={(e) => setNewTable(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={newTable.location}
                                    onChange={(e) => setNewTable(prev => ({ ...prev, location: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., Window, Corner"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end space-x-3 mt-4">
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddTable}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Add Table
                            </button>
                        </div>
                    </div>
                )}

                {/* Tables List */}
                {!loading && tables.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Table #</th>
                                        <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                                        <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                        <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {tables.map((table) => (
                                        <tr key={table._id} className="hover:bg-gray-50">
                                            <td className="py-4 px-6 text-sm font-medium text-gray-900">#{table.tableNumber}</td>
                                            <td className="py-4 px-6 text-sm text-gray-600">{table.capacity} people</td>
                                            <td className="py-4 px-6 text-sm text-gray-600">{table.location || '-'}</td>
                                            <td className="py-4 px-6">{getStatusBadge(table.isActive)}</td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => regenerateQRCode(table._id)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Regenerate QR Code"
                                                    >
                                                        🔄
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusToggle(table._id)}
                                                        className={`p-2 rounded-lg transition-colors ${table.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                                        title={table.isActive ? 'Deactivate Table' : 'Activate Table'}
                                                    >
                                                        {table.isActive ? '🔴' : '🟢'}
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedTable(table)}
                                                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                        title="View QR Code"
                                                    >
                                                        👁️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* QR Code Preview */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code Preview</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Table for Preview
                                    </label>
                                    <select
                                        value={selectedTable?._id || ''}
                                        onChange={(e) => {
                                            const tableId = e.target.value;
                                            const table = tables.find(t => t._id === tableId);
                                            setSelectedTable(table || null);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select a table...</option>
                                        {tables.map(table => (
                                            <option key={table._id} value={table._id}>
                                                Table {table.tableNumber} - {table.capacity} people {table.location ? `(${table.location})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            {selectedTable ? (
                                <QRCodePreview table={selectedTable} />
                            ) : (
                                <div className="w-full h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                    <div className="text-center text-gray-500">
                                        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                        </svg>
                                        <p>Select a table to preview its QR code</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Tables</p>
                                <p className="text-2xl font-bold text-gray-900">{tables.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-full">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active Tables</p>
                                <p className="text-2xl font-bold text-gray-900">{tables.filter(t => t.isActive).length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-red-100 rounded-full">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Inactive Tables</p>
                                <p className="text-2xl font-bold text-gray-900">{tables.filter(t => !t.isActive).length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-full">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Capacity</p>
                                <p className="text-2xl font-bold text-gray-900">{tables.reduce((sum, table) => sum + table.capacity, 0)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminTableManagement;