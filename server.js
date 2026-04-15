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
const LOJA_ABERTA_FIELD_ID = "fldSbtTQ3eV0YLxWf";

app.get("/status-loja", async (req, res) => {
    try {
        const url = `https://api.airtable.com/v0/${BASE_ID}/${CONFIG_TABLE_ID}`;
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
        });
        let lojaAberta = true;
        if (response.data.records && response.data.records.length > 0) {
            const valor = response.data.records[0].fields[LOJA_ABERTA_FIELD_ID];
            if (valor === false) lojaAberta = false;
        }
        res.json({ aberta: lojaAberta });
    } catch (error) {
        res.json({ aberta: true });
    }
});

app.get("/taxa-entrega", async (req, res) => {
    try {
        const url = `https://api.airtable.com/v0/${BASE_ID}/${CONFIG_TABLE_ID}`;
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
        });
        let taxa = 5.00;
        if (response.data.records && response.data.records.length > 0) {
            const valor = response.data.records[0].fields[TAXA_FIELD_ID];
            if (valor) taxa = parseFloat(valor);
        }
        res.json({ taxa: taxa });
    } catch (error) {
        res.json({ taxa: 5.00 });
    }
});

app.get("/produtos", async (req, res) => {
    try {
        const url = `https://api.airtable.com/v0/${BASE_ID}/Produtos`;
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/adicionais", async (req, res) => {
    try {
        const url = `https://api.airtable.com/v0/${BASE_ID}/Adicionais`;
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/pedido", async (req, res) => {
    const { cliente, telefone, endereco, itens, adicionais, formaPagamento, tipoEntrega, subtotal, taxaEntrega, total, data } = req.body;
    try {
        await axios.post(
            `https://api.airtable.com/v0/${BASE_ID}/Pedidos`,
            {
                fields: {
                    cliente: cliente || "",
                    telefone: telefone || "",
                    endereço: endereco || "",
                    itens: itens || "",
                    adicionais: adicionais || "Nenhum adicional",
                    "formas de pagamento": formaPagamento || "",
                    "status do pagamento": "Pagamento na Entrega",
                    "status do pedido": "Novo",
                    "tipo de entrega": tipoEntrega || "",
                    subtotal: subtotal || 0,
                    "taxa entrega": taxaEntrega || 0,
                    total: total || 0,
                    "data do pedido": data || new Date().toISOString()
                }
            },
            { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, "Content-Type": "application/json" } }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get("/", (req, res) => {
    res.json({ message: "Servidor funcionando!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));