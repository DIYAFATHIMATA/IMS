import { useParams } from 'react-router-dom';
import { storage } from '../services/storage';
import { useEffect, useState } from 'react';
import { Receipt, Printer } from 'lucide-react';

export default function Invoice() {
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);

    useEffect(() => {
        // Determine if we are looking for sale ID or Invoice ID
        // Simplification: search sales for generic match
        const sales = storage.getSales();
        const found = sales.find(s => s.invoiceId === id || s.id.toString() === id);
        setInvoice(found);
    }, [id]);

    if (!invoice) return <div className="p-8 text-center text-gray-500">Loading Invoice...</div>;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 flex justify-center items-start">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full print:shadow-none print:w-full">
                <div className="flex justify-between items-center mb-8 pb-8 border-b border-gray-200">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                            <Receipt className="w-8 h-8 text-emerald-600" />
                            INVOICE
                        </h1>
                        <p className="text-gray-500 mt-2">#{invoice.invoiceId}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="font-bold text-xl">IMS Corp</h2>
                        <p className="text-gray-500 text-sm">123 Business St,<br />Tech City, 560001</p>
                        <p className="text-gray-500 text-sm mt-1">GSTIN: 29AAAAA0000A1Z5</p>
                    </div>
                </div>

                <div className="flex justify-between mb-8">
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Bill To</h3>
                        <p className="font-bold text-gray-900">{invoice.customerName}</p>
                        <p className="text-gray-500 text-sm">Date: {new Date(invoice.date).toLocaleDateString()}</p>
                    </div>
                </div>

                <table className="w-full mb-8">
                    <thead>
                        <tr className="border-b-2 border-gray-100 text-left text-sm text-gray-500">
                            <th className="pb-3">Item Description</th>
                            <th className="pb-3 text-center">Qty</th>
                            <th className="pb-3 text-right">Price</th>
                            <th className="pb-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {invoice.items.map((item, i) => (
                            <tr key={i} className="border-b border-gray-50">
                                <td className="py-3">
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-xs text-gray-400">GST: {item.gst}%</p>
                                </td>
                                <td className="py-3 text-center">{item.quantity}</td>
                                <td className="py-3 text-right">₹{item.price}</td>
                                <td className="py-3 text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end mb-8">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between text-gray-500">
                            <span>Subtotal</span>
                            <span>₹{invoice.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                            <span>Tax (GST)</span>
                            <span>₹{invoice.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-gray-900 pt-4 border-t border-gray-100">
                            <span>Total</span>
                            <span>₹{invoice.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-8 border-t border-gray-200">
                    <p className="text-gray-500 text-sm mb-4">Thank you for your business!</p>
                    <button
                        onClick={() => window.print()}
                        className="print:hidden px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                        <Printer className="w-4 h-4" /> Print Invoice
                    </button>
                </div>
            </div>
        </div>
    );
}
