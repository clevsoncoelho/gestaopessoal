import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface ExtractedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  kind: "income" | "expense";
  category: string;
  notes: string;
}

// Categorizador por palavras-chave
function inferCategory(desc: string): string {
  const d = desc.toLowerCase();
  if (/uber|99app|posto|combustivel|estacionamento|gasolina|auto/.test(d)) return "Transporte";
  if (/ifood|mercado|supermercado|padaria|restaurante|burger|pizza|lanche|acougue|hortifruti/.test(d)) return "Alimentação";
  if (/luz|enel|agua|sabesp|energia|aluguel|condominio|internet|claro|vivo|tim/.test(d)) return "Casa";
  if (/netflix|spotify|cinema|steam|prime|hbo|disney|jogo|show/.test(d)) return "Lazer";
  if (/farmacia|drogaria|droga|medico|hospital|consulta|saude|unimed/.test(d)) return "Saúde";
  if (/salario|remuneracao|pagamento recebido|pro-labore|honorarios|venda/.test(d)) return "Serviços";
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
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
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
    const buffer = Buffer.from(bytes);

    // Importa PDFParse
    const pdfModule = await import("pdf-parse");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PDFParseClass: any = (pdfModule as any).PDFParse || (pdfModule as any).default || pdfModule;

    let text = "";
    if (typeof PDFParseClass === "function" && PDFParseClass.prototype?.getText) {
      const parser = new PDFParseClass({ data: buffer });
      const res = await parser.getText();
      text = typeof res === "string" ? res : res?.text || "";
      if (typeof parser.destroy === "function") {
        await parser.destroy();
      }
    } else if (typeof PDFParseClass === "function") {
      const res = await PDFParseClass(buffer);
      text = res?.text || "";
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { message: "Não foi possível extrair texto do PDF. O arquivo pode ser uma imagem escaneada." },
        { status: 422 }
      );
    }

    const lines = text
      .split(/\r?\n/)
      .map((l: string) => l.trim())
      .filter((l: string) => Boolean(l));

    const transactions: ExtractedTransaction[] = [];
    const currentYear = new Date().getFullYear();

    // Regex flexíveis para extratos bancários brasileiros:
    // Padrão 1: Data no início (DD/MM/AAAA ou DD/MM) seguido de descrição e valor
    const dateRegex = /^(\d{2})\/(\d{2})(?:\/(\d{2,4}))?/;
    const amountRegex = /([+-]?\s*(?:R\$\s*)?(?:\d{1,3}(?:\.\d{3})*|\d+),\d{2})(?:\s*([DCdc+-]))?/;

    for (const line of lines) {
      const dateMatch = line.match(dateRegex);
      if (!dateMatch) continue;

      const rest = line.slice(dateMatch[0].length).trim();
      const amountMatch = rest.match(amountRegex);
      if (!amountMatch) continue;

      const day = dateMatch[1];
      const month = dateMatch[2];
      let year = dateMatch[3];

      if (!year) {
        year = String(currentYear);
      } else if (year.length === 2) {
        year = `20${year}`;
      }

      const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

      // Limpar e extrair a descrição
      const amountIndex = rest.indexOf(amountMatch[0]);
      let description = rest.slice(0, amountIndex).trim();

      // Se a descrição for muito curta, pode ser que o valor veio antes
      if (!description || description.length < 2) {
        description = rest.replace(amountMatch[0], "").trim();
      }

      if (!description) {
        description = "Movimentação Bancária";
      }

      // Tratamento do valor
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
        /enviad|debito|pagamento|saque|tarifa|compra|saida/i.test(description);

      const isPositive =
        indicator === "C" ||
        indicator === "+" ||
        /recebid|ted receb|pix receb|salario|deposito|rendimento/i.test(description);

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
        notes: `Importado de extrato bancário: ${description}`,
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
      { message: err instanceof Error ? err.message : "Erro interno ao processar o extrato." },
      { status: 500 }
    );
  }
}
