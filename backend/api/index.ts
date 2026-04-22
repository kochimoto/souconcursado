// Teste de Isolamento Absoluto
export default function handler(req: any, res: any) {
  res.status(200).json({ 
    status: "ok", 
    message: "O motor da Vercel está funcionando",
    time: new Date().toISOString()
  });
}
