import { Application } from '../types';
import { formatDate } from './utils';

/**
 * Export applications to a CSV file that opens correctly in Excel with Arabic support.
 * Uses UTF-8 BOM so Excel recognizes the encoding.
 */
export function exportApplicationsToExcel(applications: Application[], opportunityTitle?: string) {
    const statusMap: Record<string, string> = {
        pending: 'قيد المراجعة',
        accepted: 'مقبول',
        rejected: 'مرفوض',
    };

    // CSV Header
    const headers = ['الاسم', 'البريد الإلكتروني', 'رقم الهاتف', 'الرسالة', 'الحالة', 'تاريخ التقديم', 'الفرصة'];

    // CSV Rows
    const rows = applications.map(app => [
        app.volunteerName,
        app.volunteerEmail,
        app.volunteerPhone || '-',
        // Escape quotes in message and wrap in quotes
        `"${(app.message || '').replace(/"/g, '""')}"`,
        statusMap[app.status] || app.status,
        formatDate(app.appliedAt),
        app.opportunityTitle,
    ]);

    // Build CSV content with UTF-8 BOM for Arabic support in Excel
    const BOM = '\uFEFF';
    const csvContent = BOM + [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = opportunityTitle
        ? `متقدمين - ${opportunityTitle}.csv`
        : 'متقدمين.csv';
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
