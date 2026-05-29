import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// MASUKKAN URL NEW DEPLOYMENT YANG BARU DI SINI
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxmxpojeor2QCX2yWY02gZnHEg7KTa9r7JbItRIMTMevMqWC-kH-fRZpeZLlEgPTgsq3g/exec";

export async function GET() {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    // Cek jika Google mengirim HTML bukannya JSON
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      return NextResponse.json(
        { error: "Google Apps Script mengembalikan halaman HTML. Pastikan Deployment diatur ke 'Anyone' dan sudah di-Authorize." },
        { status: 401 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}