import FileAPI from '../api/file.api';
import { NotFoundError } from '../errors/RequestErrors';
import { FileResponse } from '../models/mappers';
import { reduce } from '../reducers';
import { fileReduce } from '../reducers/file.reducer';

// Om vi kör tester beh;ver vi denna konstant
// för att kunna spionera på den
export const fileApi = new FileAPI();

/**
 * Funktion som används för att skapa en DataLoader
 * för att batcha Files-requests och öka prestanda
 * markant
 * @param fileIds List of postnames
 */
export const batchFilesFunction = async (
  fileIds: readonly string[],
): Promise<ArrayLike<FileResponse | Error>> => {
  /**
   * Batch function used as parameter to DataLoader constructor,
   * see /src/resolvers/README.md
   * @param postnames
   */
  const apiResponse = await fileApi.getMultipleFilesById(fileIds);
  if (apiResponse === null) return [];
  const files = reduce(apiResponse, fileReduce);

  // We want array as Map of username to Post object
  const fileMap = new Map<string, FileResponse>();

  files.forEach((f) => {
    // To make sure id is a key (it is, but the
    // Partial<> is messing with TS)
    if (f.id != null) fileMap.set(f.id, f);
  });

  // All keys need a value; postnames without value
  // in map are replaced by error
  const results = fileIds.map((id): FileResponse | Error => {
    return fileMap.get(id) || new NotFoundError(`No result for file id ${id}`);
  });

  return results;
};
