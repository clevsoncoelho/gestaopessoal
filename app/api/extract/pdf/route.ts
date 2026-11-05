import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Polyfill defensivo para ambientes serverless Node.js
if (typeof globalThis.DOMMatrix === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    is2D = true;
    isIdentity = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(init?: any) {
      if (Array.isArray(init)) {
        this.a = init[0] ?? 1; this.b = init[1] ?? 0;
        this.c = init[2] ?? 0; this.d = init[3] ?? 1;
        this.e = init[4] ?? 0; this.f = init[5] ?? 0;
      }
    }
    multiply() { return this; }
    translate() { return this; }
    scale() { return this; }
    rotate() { return this; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transformPoint(p: any) { return p; }
    inverse() { return this; }
  };
}

interface ExtractedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  kind: "income" | "expense";
  category: string;
  notes: string;
}

const MONTH_NAMES: Record<string, string> = {
  jan: "01", fev: "02", mar: "03", abr: "04", mai: "05", jun: "06",
  jul: "07", ago: "08", set: "09", out: "10", nov: "11", dez: "12",
};

function inferCategory(desc: string): string {
  const d = desc.toLowerCase();
  if (/uber|99app|posto|combustivel|estacionamento|gasolina|auto|ipva|pedagio/.test(d)) return "Transporte";
  if (/ifood|mercado|supermercado|padaria|restaurante|burger|pizza|lanche|acougue|hortifruti|carrefour|pao de acucar|assai/.test(d)) return "Alimentação";
  if (/luz|enel|agua|sabesp|energia|aluguel|condominio|internet|claro|vivo|tim|iptu|gas/.test(d)) return "Casa";
  if (/netflix|spotify|cinema|steam|prime|hbo|disney|jogo|show|ingresso/.test(d)) return "Lazer";
  if (/farmacia|drogaria|droga|medico|hospital|consulta|saude|unimed|drogasil|raia/.test(d)) return "Saúde";
  if (/salario|remuneracao|pagamento recebido|pro-labore|honorarios|venda|prolabore/.test(d)) return "Serviços";
  return "Outros";
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ message: "Serviço Supabase não configurado." }, { status: 503 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ message: "Não autorizado. Faça login novamente." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "Nenhum arquivo enviado." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ message: "O arquivo precisa ser um documento PDF." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const uint8Array = new Uint8Array(bytes);

    // Extração com unpdf (sem erros de DOM/DOMMatrix no runtime serverless)
    const { extractText } = await import("unpdf");
    const extracted = await extractText(uint8Array);

    const fullText = Array.isArray(extracted.text)
      ? extracted.text.join("\n")
      : String(extracted.text || "");

    if (!fullText || fullText.trim().length === 0) {
      return NextResponse.json(
        { message: "Não foi possível extrair texto legível do PDF. Se o documento for escaneado/foto, exporte o extrato digital oficial diretamente do app do seu banco." },
        { status: 422 }
      );
    }

    const lines = fullText
      .split(/\r?\n/)
      .map((l: string) => l.trim())
      .filter((l: string) => Boolean(l));

    const transactions: ExtractedTransaction[] = [];
    const currentYear = new Date().getFullYear();

    // Regex 1: Datas numéricas "DD/MM/AAAA" ou "DD/MM"
    const dateNumRegex = /^(\d{2})\/(\d{2})(?:\/(\d{2,4}))?/;
    // Regex 2: Datas com mês por extenso "05 OUT" ou "05 OUT 2026"
    const dateTextRegex = /^(\d{2})\s+([A-Za-z]{3})(?:\s+(\d{4}))?/;
    // Regex para valores monetários brasileiros
    const amountRegex = /([+-]?\s*(?:R\$\s*)?(?:\d{1,3}(?:\.\d{3})*|\d+),\d{2})(?:\s*([DCdc+-]))?/;

    for (const line of lines) {
      let day = "";
      let month = "";
      let year = String(currentYear);
      let rest = "";

      const matchNum = line.match(dateNumRegex);
      const matchText = line.match(dateTextRegex);

      if (matchNum) {
        day = matchNum[1];
        month = matchNum[2];
        if (matchNum[3]) {
          year = matchNum[3].length === 2 ? `20${matchNum[3]}` : matchNum[3];
        }
        rest = line.slice(matchNum[0].length).trim();
      } else if (matchText) {
        day = matchText[1];
        const monthKey = matchText[2].toLowerCase();
        month = MONTH_NAMES[monthKey] || "01";
        if (matchText[3]) {
          year = matchText[3];
        }
        rest = line.slice(matchText[0].length).trim();
      } else {
        continue;
      }

      const amountMatch = rest.match(amountRegex);
      if (!amountMatch) continue;

      const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

      // Extrai e limpa a descrição
      const amountIndex = rest.indexOf(amountMatch[0]);
      let description = rest.slice(0, amountIndex).trim();

      if (!description || description.length < 2) {
        description = rest.replace(amountMatch[0], "").trim();
      }

      description = description
        .replace(/^[-–—|•:]+/, "")
        .replace(/[-–—|•:]+$/, "")
        .trim();

      if (!description || description.length < 2) {
        description = "Movimentação Bancária";
      }

      // Converte o valor
      const rawAmountStr = amountMatch[1]
        .replace(/\s+/g, "")
        .replace(/R\$/gi, "")
        .replace(/\./g, "")
        .replace(",", ".");

      const numVal = parseFloat(rawAmountStr);
      if (isNaN(numVal)) continue;

      const indicator = (amountMatch[2] || "").toUpperCase();
      const isNegative =
        numVal < 0 ||
        indicator === "D" ||
        indicator === "-" ||
        /enviad|debito|pagamento|saque|tarifa|compra|saida|pagto/i.test(description);

      const isPositive =
        indicator === "C" ||
        indicator === "+" ||
        /recebid|ted receb|pix receb|salario|deposito|rendimento|credito/i.test(description);

      const kind: "income" | "expense" = isPositive && !isNegative ? "income" : "expense";
      const cleanAmount = Math.abs(numVal);

      if (cleanAmount <= 0) continue;

      const category = inferCategory(description);

      transactions.push({
        id: crypto.randomUUID(),
        date: isoDate,
        description,
        amount: cleanAmount,
        kind,
        category,
        notes: `Extrato bancário: ${description}`,
      });
    }

    return NextResponse.json({
      success: true,
      totalFound: transactions.length,
      transactions,
    });
  } catch (err) {
    console.error("Erro ao processar PDF:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Erro ao processar o extrato." },
      { status: 500 }
    );
  }
}
