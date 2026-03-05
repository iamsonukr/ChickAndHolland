"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx-js-style";
import JSZip from "jszip";

// Load JSZip for XLSX styling support in the browser
if (typeof window !== "undefined") {
  (window as any).JSZip = JSZip;
}

const ExpensesDownloader = ({ expenses, name, date }) => {
  const fullExpensesData = expenses?.expenses || [];

  const downloadExcel = () => {
    const data = fullExpensesData.map((exp) => ({
      "Payment Date": new Date(exp.createdAt).toLocaleDateString(),
      Invoice: exp.invoice,
      Recipient: exp.payer,
      "Expense Type": exp.expenseType + (exp.otherType ? ` - ${exp.otherType}` : ""),
      Amount: exp.amount,
      Currency: exp.currency.toUpperCase(),
      Status: exp.isPaid ? "Paid" : "Unpaid",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");

    /* ================= HEADER STYLE ================= */
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
      if (!cell) continue;
      cell.s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "1F2937" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };
    }

    /* ================= BODY STYLE ================= */
    for (let R = 1; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        if (!cell) continue;
        cell.s = {
          fill: { fgColor: { rgb: R % 2 === 0 ? "F9FAFB" : "FFFFFF" } },
          alignment: { vertical: "center", horizontal: C >= 4 ? "center" : "left" },
          border: {
            top: { style: "thin" }, bottom: { style: "thin" },
            left: { style: "thin" }, right: { style: "thin" },
          },
        };
      }
    }

    ws["!cols"] = [{ wch: 14 }, { wch: 18 }, { wch: 22 }, { wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 14 }];
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };

    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, `${name} Expenses ${date}.xlsx`);
  };

  const downloadPPT = async () => {
    const PptxGenJS = (await import("pptxgenjs")).default;
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    const slide = pptx.addSlide();

    slide.addText(`${name} Expenses`, { x: 0.3, y: 0.2, fontSize: 26, bold: true });
    slide.addText(date, { x: 0.3, y: 0.8, fontSize: 14 });

    const tableHeaders = ["Payment Date", "Invoice", "Recipient", "Expense Type", "Amount", "Currency", "Status"];
    const tableRows = fullExpensesData.map((expense) => [
      new Date(expense.createdAt).toDateString(),
      expense.invoice,
      expense.payer,
      expense.expenseType + (expense.otherType ? ` - ${expense.otherType}` : ""),
      expense.amount.toString(),
      expense.currency,
      expense.isPaid ? "Paid" : "Unpaid",
    ]);

    slide.addTable([tableHeaders, ...tableRows], {
      x: 0.2, y: 1.2, w: 12.5, fontSize: 8,
      border: { type: "solid", color: "444444", pt: 0.5 },
      autoPage: false,
      rowH: 0.18,
      colW: [1.1, 1, 1.4, 2.4, 0.7, 0.7, 0.8],
    });

    const summaryText = expenses.totalAmount
      .map((t) => `${t.currency.toUpperCase()}: ${t.totalAmount}`)
      .join("     ");

    slide.addText(`Summary:  ${summaryText}`, { x: 0.3, y: 6.5, fontSize: 14, bold: true });
    pptx.writeFile(`${name} Expenses ${date}.pptx`);
  };

  return (
    <div className="justify-end w-full flex space-x-2">
      <Button onClick={downloadExcel} variant="outline">Download Excel</Button>
      <Button onClick={downloadPPT} variant="outline">Download PPT</Button>
    </div>
  );
};

export default ExpensesDownloader;