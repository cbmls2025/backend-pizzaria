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
const CATEGORIA_ADICIONAIS_ID = "fldRtS8YRVejxtl1R";

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

// ==================== ROTA PARA BUSCAR TODOS OS PRODUTOS (COM PAGINAÇÃO) ====================
app.get("/produtos", async (req, res) => {
    try {
        console.log("📦 Buscando todos os produtos...");
        
        let allRecords = [];
        let offset = null;
        let hasMore = true;
        
        while (hasMore) {
            let url = `https://api.airtable.com/v0/${BASE_ID}/Produtos?pageSize=100`;
            if (offset) {
                url += `&offset=${offset}`;
            }
            
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
            });
            
            if (response.data.records && response.data.records.length > 0) {
                allRecords = [...allRecords, ...response.data.records];
            }
            
            offset = response.data.offset;
            hasMore = !!offset;
            
            console.log(`📦 Carregados ${allRecords.length} produtos até agora...`);
        }
        
        console.log(`✅ Total de produtos carregados: ${allRecords.length}`);
        res.json({ records: allRecords });
        
    } catch (error) {
        console.error("❌ Erro produtos:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// ==================== ROTA PARA BUSCAR TODOS OS ADICIONAIS (COM PAGINAÇÃO) ====================
app.get("/adicionais", async (req, res) => {
    try {
        console.log("📦 Buscando todos os adicionais...");
        
        let allRecords = [];
        let offset = null;
        let hasMore = true;
        
        while (hasMore) {
            let url = `https://api.airtable.com/v0/${BASE_ID}/Adicionais?pageSize=100`;
            if (offset) {
                url += `&offset=${offset}`;
            }
            
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
            });
            
            if (response.data.records && response.data.records.length > 0) {
                allRecords = [...allRecords, ...response.data.records];
            }
            
            offset = response.data.offset;
            hasMore = !!offset;
            
            console.log(`📦 Carregados ${allRecords.length} adicionais até agora...`);
        }
        
        console.log(`✅ Total de adicionais carregados: ${allRecords.length}`);
        
        // Processar os dados para incluir a categoria usando o ID do campo
        const adicionaisProcessados = allRecords.map(record => {
            const fields = record.fields;
            return {
                id: record.id,
                fields: {
                    Nome: fields.Nome || "Adicional",
                    Preço: fields.Preço || 0,
                    Disponíveis: fields.Disponíveis === true,
                    Categoria: fields[CATEGORIA_ADICIONAIS_ID] || fields.Categoria || ""
                }
            };
        });
        
        res.json({ records: adicionaisProcessados });
        
    } catch (error) {
        console.error("❌ Erro adicionais:", error.message);
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

// ==================== ROTA PARA RECEBER PEDIDOS (COM OBSERVAÇÕES) ====================
app.post("/pedido", async (req, res) => {
    console.log("📦 Pedido recebido:", req.body);
    
    const { cliente, telefone, endereco, itens, adicionais, formaPagamento, tipoEntrega, subtotal, taxaEntrega, total, observacoes, data } = req.body;
    
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
                    "observacoes": observacoes || "",
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