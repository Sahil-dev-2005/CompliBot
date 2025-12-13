/**
 * JSON Helper Module
 * Generates GST JSON files for various return types
 */

/**
 * Generate GST JSON structure for filing
 * @param {Object} data - The data object containing filing information
 * @param {string} data.gstin - User's GSTIN
 * @param {string} data.trade_name - Business name
 * @param {string} data.fp - Filing period (MMYYYY format)
 * @param {string} data.return_type - Return type (GSTR1, GSTR3B, etc.)
 * @param {Array} data.invoices - Array of invoice data
 * @param {Object} data.summary - Summary totals
 * @returns {Object} Generated GST JSON structure
 */
export const generateGSTJson = (data) => {
    const { gstin, trade_name, fp, return_type = 'GSTR3B', invoices = [], summary = {} } = data;

    // Extract state code and financial year from inputs
    const stateCode = gstin.substring(0, 2);
    const month = fp.substring(0, 2);
    const year = fp.substring(2);
    
    // Determine financial year
    const fy = parseInt(month) >= 4 ? `${year}-${(parseInt(year) + 1).toString().slice(-2)}` : `${parseInt(year) - 1}-${year.slice(-2)}`;

    const baseStructure = {
        gstin: gstin,
        ret_period: fp,
        state_cd: stateCode,
        filing_date: new Date().toISOString().split('T')[0],
        version: "GST3.0.4",
        hash: "hash",
        fy: fy
    };

    switch (return_type) {
        case 'GSTR1':
            return {
                ...baseStructure,
                b2b: invoices.filter(inv => inv.type === 'b2b').map(inv => ({
                    ctin: inv.buyer_gstin,
                    inv: [{
                        inum: inv.invoice_number,
                        idt: inv.invoice_date,
                        val: inv.total_value,
                        pos: inv.place_of_supply,
                        rchrg: inv.reverse_charge || "N",
                        inv_typ: inv.invoice_type || "R",
                        itms: inv.items.map(item => ({
                            num: item.sr_no,
                            itm_det: {
                                txval: item.taxable_value,
                                rt: item.tax_rate,
                                iamt: item.igst_amount || 0,
                                camt: item.cgst_amount || 0,
                                samt: item.sgst_amount || 0
                            }
                        }))
                    }]
                })),
                b2cl: invoices.filter(inv => inv.type === 'b2cl'),
                b2cs: summary.b2cs || [],
                hsn: summary.hsn || []
            };

        case 'GSTR3B':
            return {
                ...baseStructure,
                sup_details: {
                    osup_zero: { txval: summary.zero_rated || 0, iamt: 0 },
                    osup_nil_exmp: { txval: summary.nil_exempt || 0 },
                    isup_rev: { 
                        txval: summary.reverse_charge_taxable || 0,
                        iamt: summary.reverse_charge_igst || 0,
                        camt: summary.reverse_charge_cgst || 0,
                        samt: summary.reverse_charge_sgst || 0
                    },
                    osup_det: {
                        txval: summary.total_taxable || 0,
                        iamt: summary.total_igst || 0,
                        camt: summary.total_cgst || 0,
                        samt: summary.total_sgst || 0
                    }
                },
                inter_sup: {
                    unreg_details: [],
                    comp_details: [],
                    uin_details: []
                },
                itc_elg: {
                    itc_avl: [{
                        ty: "IMPG",
                        iamt: summary.itc_igst || 0,
                        camt: summary.itc_cgst || 0,
                        samt: summary.itc_sgst || 0
                    }],
                    itc_rev: [{
                        ty: "RUL",
                        iamt: 0,
                        camt: 0,
                        samt: 0
                    }],
                    itc_net: {
                        iamt: summary.itc_igst || 0,
                        camt: summary.itc_cgst || 0,
                        samt: summary.itc_sgst || 0
                    }
                }
            };

        default:
            return {
                ...baseStructure,
                error: "Unsupported return type",
                supported_types: ["GSTR1", "GSTR3B"]
            };
    }
};

/**
 * Validate GST JSON structure
 * @param {Object} gstJson - GST JSON to validate
 * @returns {Object} Validation result with errors if any
 */
export const validateGSTJson = (gstJson) => {
    const errors = [];
    
    // Basic validations
    if (!gstJson.gstin || gstJson.gstin.length !== 15) {
        errors.push("Invalid GSTIN format");
    }
    
    if (!gstJson.ret_period || !/^\d{6}$/.test(gstJson.ret_period)) {
        errors.push("Invalid return period format (should be MMYYYY)");
    }
    
    if (!gstJson.state_cd || !/^\d{2}$/.test(gstJson.state_cd)) {
        errors.push("Invalid state code");
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
};

export default { generateGSTJson, validateGSTJson };