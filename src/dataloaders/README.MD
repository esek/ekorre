# Dataloaders

These are functions related to DataLoader and the
GraphQL (n+1) problem. To create a new kind of dataloader,
create a batch function and a create<Type>DataLoader() function.

## Mappers

To use a DataLoader, a new mapper is most likely needed, as Typescript does not understand field-resolver handling.
Add a new mapper to `/models/mappers.ts` and then link it in `codegen.yml`

```yaml
mappers:
  Article: ./models/mappers#ArticleResponse
```

## Creating a new DataLoader

Creating a new DataLoader can be done using the `createDataLoader` helper function.
It is recommended to add it to Context as DataLoader caches its values. This way the cache is reset on every request.

```typescript
createDataLoader(callback);
```

## Using the DataLoader

To use a DataLoader, use the helper method `useDataLoader`.
DataLoaders should primarily be used in fieldresolvers.

```typescript
useDataLoader(callback: <T,E>(model: T, context: Context) => {key?: string, dataLoader: DataLoader<string, E>});
```