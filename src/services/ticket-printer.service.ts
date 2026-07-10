import net from "node:net";

import { env } from "../config/env";

export type TicketItem = {
  name: string;
  quantity: number;
  lineTotal: number;
  customizations: string[];
  kitchenNote: string | null;
};

export type TicketOrder = {
  id: string;
  createdAt: string;
  studentName?: string | null;
  studentAllergens?: string[];
  shift: string;
  total: number;
  items: TicketItem[];
};

export function createTestTicketOrder(): TicketOrder {
  return {
    id: "00000000-0000-4000-8000-000000000123",
    createdAt: new Date().toISOString(),
    studentName: "Alumno de prueba",
    studentAllergens: ["Gluten", "Huevo"],
    shift: "MORNING",
    total: 4.75,
    items: [
      {
        name: "Bocadillo de tortilla",
        quantity: 1,
        lineTotal: 3.5,
        customizations: ["Sin tomate", "+ Queso"],
        kitchenNote: "Cortar por la mitad"
      },
      {
        name: "Zumo de naranja",
        quantity: 1,
        lineTotal: 1.25,
        customizations: [],
        kitchenNote: null
      }
    ]
  };
}

function pickupNumber(orderId: string): string {
  const numeric = Number.parseInt(orderId.replace(/-/g, "").slice(0, 8), 16);
  return String(100 + (numeric % 900));
}

function center(text: string, width = 42) {
  const clean = text.slice(0, width);
  const left = Math.max(0, Math.floor((width - clean.length) / 2));
  return `${" ".repeat(left)}${clean}`;
}

function printSafe(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[€]/g, "EUR")
    .replace(/[^\x20-\x7E]/g, "");
}

function line(text = "") {
  return `${printSafe(text)}\r\n`;
}

function buildTicket(order: TicketOrder): Buffer {
  const rows: string[] = [];
  rows.push(line("KOMO"));
  rows.push(line(center("Cafeteria escolar")));
  rows.push(line("------------------------------------------"));
  rows.push(line(center(`PEDIDO ${pickupNumber(order.id)}`)));
  rows.push(line(`Fecha: ${new Date(order.createdAt).toLocaleString("es-ES")}`));
  rows.push(line(`Alumno: ${order.studentName ?? "Alumno"}`));
  rows.push(line(`Alergenos: ${(order.studentAllergens?.length ? order.studentAllergens.join(", ") : "Sin declarar")}`));
  rows.push(line(`Turno: ${order.shift}`));
  rows.push(line("------------------------------------------"));
  order.items.forEach((item) => {
    rows.push(line(`${item.quantity} x ${item.name}`));
    item.customizations.forEach((mod) => rows.push(line(`   ${mod}`)));
    if (item.kitchenNote) rows.push(line(`   Nota: ${item.kitchenNote}`));
  });
  rows.push(line("------------------------------------------"));
  rows.push(line(`TOTAL: ${order.total.toFixed(2)} EUR`));
  rows.push(line(""));
  rows.push(line(center("Gracias")));
  rows.push(line(""));
  rows.push(line(""));
  return Buffer.concat([
    Buffer.from(rows.join(""), "ascii"),
    Buffer.from([0x1d, 0x56, 0x42, 0x00])
  ]);
}

function pdfSafe(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[€]/g, "EUR")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function pdfLine(text = ""): string {
  return `(${pdfSafe(text)}) Tj\n`;
}

function ticketPreviewLines(order: TicketOrder): string[] {
  const rows = [
    "KOMO",
    "Cafeteria escolar",
    "--------------------------------",
    `PEDIDO ${pickupNumber(order.id)}`,
    `Fecha: ${new Date(order.createdAt).toLocaleString("es-ES")}`,
    `Alumno: ${order.studentName ?? "Alumno"}`,
    `Alergenos: ${(order.studentAllergens?.length ? order.studentAllergens.join(", ") : "Sin declarar")}`,
    `Turno: ${order.shift}`,
    "--------------------------------"
  ];
  order.items.forEach((item) => {
    rows.push(`${item.quantity} x ${item.name}`);
    item.customizations.forEach((mod) => rows.push(`   ${mod}`));
    if (item.kitchenNote) rows.push(`   Nota: ${item.kitchenNote}`);
  });
  rows.push("--------------------------------");
  rows.push(`TOTAL: ${order.total.toFixed(2)} EUR`);
  rows.push("");
  rows.push("Gracias");
  return rows;
}

export function buildTicketPdf(order: TicketOrder): Buffer {
  const lines = ticketPreviewLines(order);
  const width = 226.77;
  const height = Math.max(360, 58 + lines.length * 13);
  const content = [
    "BT\n",
    "/F1 18 Tf\n",
    `1 0 0 1 14 ${height - 32} Tm\n`,
    pdfLine(lines[0]),
    "/F1 9 Tf\n",
    "0 -16 Td\n",
    ...lines.slice(1).flatMap((row) => [pdfLine(row), "0 -12 Td\n"]),
    "ET\n"
  ].join("");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width.toFixed(2)} ${height.toFixed(2)}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}endstream`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

export async function printOrderTicket(order: TicketOrder): Promise<void> {
  const body = buildTicket(order);
  await new Promise<void>((resolve, reject) => {
    const socket = net.createConnection({ host: env.PRINTER_HOST, port: env.PRINTER_PORT });
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (error) {
        reject(error);
        return;
      }
      resolve();
    };

    socket.setTimeout(2500);
    socket.on("connect", () => {
      socket.end(body);
    });
    socket.on("error", finish);
    socket.on("timeout", () => finish(new Error(`Printer timeout at ${env.PRINTER_HOST}:${env.PRINTER_PORT}`)));
    socket.on("close", (hadError) => {
      if (!hadError) finish();
    });
  });
}
