// server.js - Backend completo para Pizzaria Novo Sabor
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do Airtable
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = "appez90saUxtb13uD";
const TABLE_NAME = "Pedidos";
const CONFIG_TABLE_ID = "tbl5l7jUfoiMlFUt7";
const TAXA_FIELD_ID = "fldcyEPa2zmZ9AxRm";

console.log("🚀 Iniciando servidor...");
console.log("BASE_ID:", BASE_ID);
console.log("CONFIG_TABLE_ID:", CONFIG_TABLE_ID);
console.log("TAXA_FIELD_ID:", TAXA_FIELD_ID);
console.log("AIRTABLE_TOKEN configurado:", AIRTABLE_TOKEN ? "✅ Sim" : "❌ Não");

// ==================== ENDPOINT PARA BUSCAR PRODUTOS ====================
app.get("/produtos", async (req, res) => {
    try {
        console.log("📦 Buscando produtos...");
        const url = `https://api.airtable.com/v0/${BASE_ID}/Produtos`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
        });
        console.log("✅ Produtos encontrados:", response.data.records?.length || 0);
        res.json(response.data);
    } catch (error) {
        console.error("❌ Erro ao buscar produtos:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// ==================== ENDPOINT PARA BUSCAR ADICIONAIS ====================
app.get("/adicionais", async (req, res) => {
    try {
        console.log("📦 Buscando adicionais...");
        const url = `https://api.airtable.com/v0/${BASE_ID}/Adicionais`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
        });
        console.log("✅ Adicionais encontrados:", response.data.records?.length || 0);
        res.json(response.data);
    } catch (error) {
        console.error("❌ Erro ao buscar adicionais:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// ==================== ENDPOINT PARA BUSCAR TAXA DE ENTREGA ====================
app.get("/taxa-entrega", async (req, res) => {
    try {
        console.log("💰 Buscando taxa de entrega...");
        const url = `https://api.airtable.com/v0/${BASE_ID}/${CONFIG_TABLE_ID}`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
        });
        
        let taxa = 5.00;
        if (response.data.records && response.data.records.length > 0) {
            const fields = response.data.records[0].fields;
            console.log("Campos encontrados:", Object.keys(fields));
            const valor = fields[TAXA_FIELD_ID] || fields.taxa_entrega;
            if (valor !== undefined && valor !== null) {
                taxa = parseFloat(valor);
            }
        }
        console.log("💰 Taxa retornada:", taxa);
        res.json({ taxa: taxa });
    } catch (error) {
        console.error("❌ Erro ao buscar taxa:", error.message);
        res.json({ taxa: 5.00 });
    }
});

// ==================== ENDPOINT PARA RECEBER PEDIDOS ====================
app.post("/pedido", async (req, res) => {
    console.log("📦 Pedido recebido:", req.body);
    
    const { cliente, telefone, endereco, itens, adicionais, formaPagamento, tipoEntrega, subtotal, taxaEntrega, total, data } = req.body;
    
    try {
        const adicionaisTexto = adicionais || "Nenhum adicional";
        
        const response = await axios.post(
            `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`,
            {
                fields: {
                    "cliente": cliente || "",
                    "telefone": telefone || "",
                    "endereço": endereco || "",
                    "itens": itens || "",
                    "adicionais": adicionaisTexto,
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});