import { FileResponse } from '@/models/mappers';
import { reduce } from '@/reducers';
import FileAPI from '@api/file';
import { fileReduce } from '@reducer/file';

import { sortBatchResult } from './util';

// Om vi kör tester behöver vi denna konstant
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
  const apiResponse = await fileApi.getMultipleFilesById(fileIds);
  if (apiResponse == null) return [];

  const files = reduce(apiResponse, fileReduce);

  return sortBatchResult<string, FileResponse>(fileIds, 'id', files, 'File not found');
};
