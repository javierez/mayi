# Progress Bar Positions - Final Mapping

## 📊 Progress Bar Positions - Final Mapping

| Scenario            | Conditions                              | Bar Fills To | Substage Status                                      |
|---------------------|-----------------------------------------|--------------|------------------------------------------------------|
| 1. Alta complete    | Property created                        | 10%          | alta: accomplished                                   |
| 2. Working on Ficha | Some mandatory fields missing           | 10%          | completar-info: ongoing → Will show 24% when ongoing |
| 3. Ficha complete   | All mandatory complete, encargo = false | 24%          | completar-info: accomplished                         |
| 4. Encargo signed   | encargo = true, offerAccepted = false   | 43%          | firma-encargo: accomplished                          |
| 5. Visitas ongoing  | Encargo done, no offer yet              | 56%          | visitas: ongoing                                     |
| 6. Offer accepted   | offerAccepted = true, arrasDate = null  | 60%          | oferta-aceptada: ongoing                             |
| 7. Arras signed     | arrasDate exists, actualDeedDate = null | 73%          | arras: accomplished                                  |
| 8. Escritura signed | actualDeedDate exists, deal not closed  | 93%          | contrato: accomplished                               |
| 9. Deal closed      | closeDate exists AND status = "Closed"  | 100%         | cierre-final: accomplished                           |

---

## ✅ Data Verification Summary

All required fields ARE being fetched in getListingDetails():

| Position        | Field(s)                     | Database Column(s)                           | Fetched? |
|-----------------|------------------------------|----------------------------------------------|----------|
| Alta (10%)      | createdAt                    | listings.created_at                          | ✅        |
| Ficha (24%)     | Mandatory fields + images    | Multiple                                     | ✅        |
| Encargo (43%)   | encargo                      | listings.encargo                             | ✅        |
| Visitas (56%)   | offerAccepted = false        | Subquery on listing_contacts.offer_accepted  | ✅        |
| Oferta (60%)    | offerAccepted = true         | Subquery on listing_contacts.offer_accepted  | ✅        |
| Arras (73%)     | deal.arrasDate               | deals.arras_date via JSON object             | ✅        |
| Escritura (93%) | deal.actualDeedDate          | deals.actual_deed_date via JSON object       | ✅        |
| Cierre (100%)   | deal.closeDate + deal.status | deals.close_date + deals.stage (NOT status!) | ✅        |

**Important Note:** The database column is `deals.stage`, but it's aliased as `status` in the query JSON object.

