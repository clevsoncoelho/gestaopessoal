import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      message:
        "A conexão do Inter precisa ser habilitada no servidor com as credenciais e o certificado da integração. Nenhum segredo foi solicitado ou exposto no navegador.",
    },
    { status: 501 },
  );
}
