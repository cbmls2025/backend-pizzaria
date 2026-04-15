const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

// Configuração CORS corrigida
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = "appez90saUxtb13uD";
const CONFIG_TABLE_ID = "tbl5l7jUfoiMlFUt7";
const TAXA_FIELD_ID = "fldcyEPa2zmZ9AxRm";

console.log("🚀 Servidor iniciado!");
console.log("Token configurado:", AIRTABLE_TOKEN ? "✅ SIM" : "❌ NÃO");

// Rota para verificar se a loja está aberta
app.get("/status-loja", async (req, res) => {
    try {
        const url = `https://api.airtable.com/v0/${BASE_ID}/${CONFIG_TABLE_ID}`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
        });
        
        let lojaAberta = true;
        if (response.data.records && response.data.records.length > 0) {
            const fields = response.data.records[0].fields;
            const aberta = fields.loja_aberta;
            if (aberta !== undefined && aberta === false) {
                lojaAberta = false;
            }
        }
        res.json({ aberta: lojaAberta });
    } catch (error) {
        console.error("Erro:", error.message);
        res.json({ aberta: true });
    }
});

// Rota para buscar produtos
app.get("/produtos", async (req, res) => {
    try {
        const url = `https://api.airtable.com/v0/${BASE_ID}/Produtos`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
        });
        res.json(response.data);
    } catch (error) {
        console.error("Erro produtos:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Rota para buscar adicionais
app.get("/adicionais", async (req, res) => {
    try {
        const url = `https://api.airtable.com/v0/${BASE_ID}/Adicionais`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
        });
        res.json(response.data);
    } catch (error) {
        console.error("Erro adicionais:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Rota para buscar taxa de entrega
app.get("/taxa-entrega", async (req, res) => {
    try {
        const url = `https://api.airtable.com/v0/${BASE_ID}/${CONFIG_TABLE_ID}`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
        });
        
        let taxa = 5.00;
        if (response.data.records && response.data.records.length > 0) {
            const fields = response.data.records[0].fields;
            const valor = fields[TAXA_FIELD_ID] || fields.taxa_entrega;
            if (valor !== undefined && valor !== null) {
                taxa = parseFloat(valor);
            }
        }
        res.json({ taxa: taxa });
    } catch (error) {
        console.error("Erro taxa:", error.message);
        res.json({ taxa: 5.00 });
    }
});

// Rota para receber pedidos
app.post("/pedido", async (req, res) => {
    console.log("📦 Pedido recebido:", req.body);
    
    const { cliente, telefone, endereco, itens, adicionais, formaPagamento, tipoEntrega, subtotal, taxaEntrega, total, data } = req.body;
    
    try {
        const response = await axios.post(
            `https://api.airtable.com/v0/${BASE_ID}/Pedidos`,
            {
                fields: {
                    "cliente": cliente || "",
                    "telefone": telefone || "",
                    "endereço": endereco || "",
                    "itens": itens || "",
                    "adicionais": adicionais || "Nenhum adicional",
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
        
        console.log("✅ Pedido salvo!");
        res.json({ success: true });
    } catch (error) {
        console.error("❌ Erro:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get("/", (req, res) => {
    res.json({ message: "🚀 Servidor funcionando!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});