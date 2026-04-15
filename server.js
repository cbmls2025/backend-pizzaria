const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = "appez90saUxtb13uD";
const CONFIG_TABLE_ID = "tbl5l7jUfoiMlFUt7";
const TAXA_FIELD_ID = "fldcyEPa2zmZ9AxRm";

console.log("🚀 Servidor iniciado!");

// ==================== ROTA PARA BUSCAR TAXA DE ENTREGA ====================
app.get("/taxa-entrega", async (req, res) => {
    try {
        console.log("💰 Buscando taxa no Airtable...");
        const url = `https://api.airtable.com/v0/${BASE_ID}/${CONFIG_TABLE_ID}`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
        });
        
        let taxa = 5.00;
        
        if (response.data.records && response.data.records.length > 0) {
            const fields = response.data.records[0].fields;
            const valor = fields[TAXA_FIELD_ID];
            
            if (valor !== undefined && valor !== null) {
                taxa = parseFloat(valor);
                console.log("✅ Taxa encontrada: R$", taxa);
            } else {
                console.log("⚠️ Campo taxa_entrega não encontrado");
            }
        } else {
            console.log("⚠️ Nenhum registro na tabela Configurações");
        }
        
        res.json({ taxa: taxa });
    } catch (error) {
        console.error("❌ Erro ao buscar taxa:", error.message);
        res.json({ taxa: 5.00 });
    }
});

// ==================== ROTA PARA BUSCAR PRODUTOS ====================
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
        console.error("❌ Erro produtos:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// ==================== ROTA PARA BUSCAR ADICIONAIS ====================
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
        console.error("❌ Erro adicionais:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// ==================== ROTA PARA RECEBER PEDIDOS ====================
app.post("/pedido", async (req, res) => {
    console.log("📦 Pedido recebido:", req.body);
    
    const { cliente, telefone, endereco, itens, adicionais, formaPagamento, tipoEntrega, subtotal, taxaEntrega, total, data } = req.body;
    
    try {
        const adicionaisTexto = (adicionais && adicionais !== "Nenhum adicional") ? adicionais : "Nenhum adicional";
        
        const response = await axios.post(
            `https://api.airtable.com/v0/${BASE_ID}/Pedidos`,
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