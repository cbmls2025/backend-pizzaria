// server.js
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// O token agora vem da variável de ambiente (configurada no Render)
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = "appez90saUxtb13uD";
const TABLE_NAME = "Pedidos";

// Verifica se o token está configurado
if (!AIRTABLE_TOKEN) {
    console.error("❌ ERRO: Variável AIRTABLE_TOKEN não configurada!");
    process.exit(1);
}

// ==================== ENDPOINT PARA BUSCAR PRODUTOS ====================
app.get("/produtos", async (req, res) => {
    try {
        const url = `https://api.airtable.com/v0/${BASE_ID}/Produtos`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
        });
        res.json(response.data);
    } catch (error) {
        console.error("❌ Erro ao buscar produtos:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// ==================== ENDPOINT PARA BUSCAR ADICIONAIS ====================
app.get("/adicionais", async (req, res) => {
    try {
        const url = `https://api.airtable.com/v0/${BASE_ID}/Adicionais`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
        });
        res.json(response.data);
    } catch (error) {
        console.error("❌ Erro ao buscar adicionais:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// ==================== ENDPOINT PARA RECEBER PEDIDOS ====================
app.post("/pedido", async (req, res) => {
    console.log("📦 Pedido recebido:", req.body);
    
    const { cliente, telefone, endereco, itens, adicionais, formaPagamento, tipoEntrega, subtotal, taxaEntrega, total, data } = req.body;
    
    try {
        const response = await axios.post(
            `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`,
            {
                fields: {
                    "cliente": cliente || "",
                    "telefone": telefone || "",
                    "endereço": endereco || "",
                    "itens": itens || "",
                    "adicionais": adicionais || "",
                    "formas de pagamento": formaPagamento || "",
                    "status do pagamento": "Pagamento na Entrega",
                    "status do pedido": "Novo",
                    "tipo de entrega": tipoEntrega || "",
                    "subtotal": subtotal || 0,
                    "taxa entrega": taxaEntrega || 0,
                    "total": total || 0,
                    "data do pedido": data || new Date().toISOString()
                }
            },
            {
                headers: {
                    "Authorization": `Bearer ${AIRTABLE_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );
        
        console.log("✅ Pedido salvo no Airtable!");
        res.json({ success: true, message: "Pedido enviado com sucesso!" });
        
    } catch (error) {
        console.error("❌ Erro:", error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== ROTA DE TESTE ====================
app.get("/", (req, res) => {
    res.json({ message: "🚀 Servidor da Pizzaria Novo Sabor funcionando!" });
});

// ==================== INICIAR SERVIDOR ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});