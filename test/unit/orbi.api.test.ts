import { OrbiAPI } from '@/api/orbi.api';
import { BadRequestError } from '@/errors/request.errors';
import { Utskott } from '@generated/graphql';
import { assert } from 'console';

const api = new OrbiAPI();
// test('getting orbi activities from different months', async () => {
//   let startTime = Date.now();
//   let res = await api.getActivities(2023, 2, [Utskott.Other]);
//   let endTime = Date.now();
//   console.log(`Call to method took ${endTime - startTime} milliseconds`);
//   console.log(res);

//   startTime = Date.now();
//   res = await api.getActivities(2023, 2, [Utskott.Other]);
//   endTime = Date.now();
//   console.log(`Call to method took ${endTime - startTime} milliseconds`);
//   console.log(res);
// }, 15000);

test('getting orbi E-sektionen org tree', () => {
  //console.log(new Date(new Date().setMonth(new Date().getMonth())));
  for (let i = 0; i < 12; i++) {
    console.log(new Date(new Date().getFullYear(), new Date().getMonth(), 2, 0, 0, 0, 0));
  }
  //const res = await api.getOrganizationNodeTree();
  //const dep = await api.getDepartmentInfo([Utskott.Noju]);
  //console.log(dep);
  //console.log(res);

  //console.log(res.departments.find((v) => v.name === 'E-sektionen')?.social);
});
