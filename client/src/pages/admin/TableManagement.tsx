import React, { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';

interface Table {
    id: number;
    capacity: number;
    location: string;
    status: 'active' | 'inactive';
    qrCode?: string;
}

const AdminTableManagement: React.FC = () => {
    const [tables, setTables] = useState<Table[]>([
        { id: 1, capacity: 4, location: 'Window', status: 'active', qrCode: 'QR_TABLE_1' },
        { id: 2, capacity: 2, location: 'Corner', status: 'active', qrCode: 'QR_TABLE_2' },
        { id: 3, capacity: 6, location: 'Center', status: 'active', qrCode: 'QR_TABLE_3' },
        { id: 4, capacity: 4, location: 'Patio', status: 'inactive', qrCode: 'QR_TABLE_4' },
        { id: 5, capacity: 8, location: 'Private', status: 'active', qrCode: 'QR_TABLE_5' },
    ]);

    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTable, setNewTable] = useState({ capacity: 4, location: '', status: 'active' as const });

    const handleAddTable = () => {
        if (!newTable.location.trim()) return;
        
        const newTableData: Table = {
            id: Math.max(...tables.map(t => t.id)) + 1,
            capacity: newTable.capacity,
            location: newTable.location,
            status: newTable.status,
            qrCode: `QR_TABLE_${Math.max(...tables.map(t => t.id)) + 1}`
        };

        setTables(prev => [...prev, newTableData]);
        setNewTable({ capacity: 4, location: '', status: 'active' });
        setShowAddForm(false);
    };

    const handleStatusToggle = (id: number) => {
        setTables(prev => prev.map(table => 
            table.id === id 
                ? { ...table, status: table.status === 'active' ? 'inactive' : 'active' }
                : table
        ));
    };

    const generateQRCode = (tableId: number) => {
        // In a real app, this would generate an actual QR code
        const qrCode = `QR_TABLE_${tableId}_${Date.now()}`;
        setTables(prev => prev.map(table => 
            table.id === tableId ? { ...table, qrCode } : table
        ));
        alert(`New QR code generated for Table ${tableId}`);
    };

    const downloadQRCode = (table: Table, format: 'png' | 'pdf') => {
        // In a real app, this would trigger an actual download
        alert(`Downloading QR code for Table ${table.id} as ${format.toUpperCase()}`);
    };

    const printQRCode = (table: Table) => {
        // In a real app, this would trigger printing
        alert(`Printing QR code for Table ${table.id}`);
    };

    const getStatusBadge = (status: string) => {
        return status === 'active' 
            ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">🟢 Active</span>
            : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">🔴 Inactive</span>;
    };

    const QRCodePreview = ({ table }: { table: Table }) => (
        <div className="bg-white border-2 border-gray-200 p-4 rounded-lg text-center">
            {/* QR Code Placeholder */}
            <div className="w-32 h-32 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center">
                    <div className="text-4xl mb-2">▓▓▓▓▓▓▓</div>
                    <div className="text-4xl mb-2">▓ QR  ▓</div>
                    <div className="text-4xl">▓▓▓▓▓▓▓</div>
                </div>
            </div>
            
            <div className="space-y-2">
                <p className="font-semibold text-gray-900">Table {table.id} - {table.location}</p>
                <p className="text-sm text-gray-600">Capacity: {table.capacity} guests</p>
                
                <div className="flex flex-col space-y-2 mt-4">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => downloadQRCode(table, 'png')}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Download PNG
                        </button>
                        <button
                            onClick={() => downloadQRCode(table, 'pdf')}
                            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Download PDF
                        </button>
                    </div>
                    <button
                        onClick={() => printQRCode(table)}
                        className="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Print QR Code
                    </button>
                </div>
            </div>
        </div>
    );

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

                {/* Add Table Form */}
                {showAddForm && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Table</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                    placeholder="e.g., Window, Patio, Center"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={newTable.status}
                                    onChange={(e) => setNewTable(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">QR Code</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {tables.map((table) => (
                                    <tr key={table.id} className="hover:bg-gray-50">
                                        <td className="py-4 px-6 text-sm font-medium text-gray-900">{table.id}</td>
                                        <td className="py-4 px-6 text-sm text-gray-600">{table.capacity}</td>
                                        <td className="py-4 px-6 text-sm text-gray-600">{table.location}</td>
                                        <td className="py-4 px-6">{getStatusBadge(table.status)}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => downloadQRCode(table, 'png')}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Download QR Code"
                                                >
                                                    📥
                                                </button>
                                                <button
                                                    onClick={() => generateQRCode(table.id)}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Regenerate QR Code"
                                                >
                                                    🔄
                                                </button>
                                                <button
                                                    onClick={() => setSelectedTable(table)}
                                                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                    title="View/Edit Table"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleStatusToggle(table.id)}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        table.status === 'active' 
                                                            ? 'text-red-600 hover:bg-red-50' 
                                                            : 'text-green-600 hover:bg-green-50'
                                                    }`}
                                                    title={table.status === 'active' ? 'Deactivate' : 'Activate'}
                                                >
                                                    {table.status === 'active' ? '🔒' : '🔓'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* QR Code Preview */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code Preview</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-gray-600 mb-4">
                                📥 = Download QR &nbsp;&nbsp; 🔄 = Regenerate &nbsp;&nbsp; ✏️ = Edit
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Table for Preview
                                    </label>
                                    <select
                                        value={selectedTable?.id || ''}
                                        onChange={(e) => {
                                            const tableId = parseInt(e.target.value);
                                            const table = tables.find(t => t.id === tableId);
                                            setSelectedTable(table || null);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select a table...</option>
                                        {tables.map(table => (
                                            <option key={table.id} value={table.id}>
                                                Table {table.id} - {table.location}
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
                                <p className="text-2xl font-bold text-gray-900">{tables.filter(t => t.status === 'active').length}</p>
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
                                <p className="text-2xl font-bold text-gray-900">{tables.filter(t => t.status === 'inactive').length}</p>
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