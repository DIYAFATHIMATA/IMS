import InventoryTransaction from '../models/InventoryTransaction.js';

export const logInventoryTransaction = async ({
  productId,
  action,
  quantityChange,
  performedBy,
  performedByName,
  reference,
  notes
}) => {
  try {
    await InventoryTransaction.create({
      productId,
      action,
      quantityChange,
      performedBy: performedBy || null,
      performedByName: performedByName || '',
      reference: reference || '',
      notes: notes || ''
    });
  } catch (_error) {
    // Inventory transaction logging should not block primary flow.
  }
};
