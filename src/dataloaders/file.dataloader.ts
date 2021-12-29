import FileAPI from '../api/file.api';
import { FileResponse } from '../models/mappers';
import { reduce } from '../reducers';
import { fileReduce } from '../reducers/file.reducer';
import { sortBatchResult } from './util';

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
  if (apiResponse == null) return [];


  const files = reduce(apiResponse, fileReduce);

  return sortBatchResult<string, FileResponse>(fileIds, 'id', files, 'File not found');
};
