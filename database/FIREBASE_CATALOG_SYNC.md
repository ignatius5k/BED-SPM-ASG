# Firebase catalogue to local SQL

The customer order pages use Firebase for hawker centres, stores, products,
images, and likes. SQL is used for cuisine filters and best-selling menu item
tables.

Run this from `backend-login` after configuring `.env` and creating the local
database:

```powershell
npm install
npm run sync:firebase-catalog
```

The sync reads the live `hawkers-native` Firebase catalogue and mirrors the
current 16 stores and 64 products into the local SQL database. It can be run
again safely to refresh the mirror.

## Data ownership

- Store names, Firebase IDs, product names, descriptions, prices, image paths,
  and likes are read directly from Firebase.
- Images and likes remain in Firebase because the customer page already reads
  those fields from there.
- Cuisine tags are declared in the sync script because the Firebase store
  documents do not currently contain cuisine fields.
- Best-seller quantities come from clearly isolated local sample orders. They
  are not represented as real Firebase sales.

## Isolation

All mirrored SQL records use these prefixes:

- `FBV` for mirror-only vendors
- `FBS` for mirror-only stores
- `FBM` for mirrored menu items
- `FBO` for local sample orders
- `FBC` for the local sample customer

The original vendor, store, menu, order, complaint, feedback, rental, and
inspection records are preserved. When both an original store and a Firebase
mirror use the same customer-page mapping, the public menu API prefers the
Firebase mirror. Vendor-owned SQL records remain unchanged and available to
their vendor pages. The general `/stalls` endpoint excludes mirror-only rows so
inspection and scheduling pages retain their original store list.

## Rollback

From `backend-login`, run:

```powershell
npm run cleanup:firebase-catalog
```

This removes only the isolated mirror records. The public menu API then
automatically falls back to any original SQL mapping.
