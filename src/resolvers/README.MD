# Resolvers

Detta är den viktigaste delen av en Graphql api. Dessa hanterar
alla queries och ser till att de returnera vettig data.
För att göra det så användbart som möjligt så bör varje resolver
sköta en grej och om en resolvers funktion uttökar en annan
typ av data ska det fältet defineras i korrekt resolver. Se
`access` modulen och hur den uttökar både `post` och `user`. Detta
är dock lite av ett undantagsfall.