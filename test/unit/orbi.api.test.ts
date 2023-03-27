import { OrbiAPI } from '@/api/orbi.api';
import { BadRequestError } from '@/errors/request.errors';
import { assert } from 'console';

const api = new OrbiAPI();
test('getting orbi activities from different months', async () => {
    let startTime = Date.now();
    let res =  await api.getActivities();
    let endTime = Date.now();
    console.log(`Call to method took ${endTime - startTime} milliseconds`)
    console.log(res);
    
    
    startTime = Date.now();
    res =  await api.getActivities();
    endTime = Date.now();
    console.log(`Call to method took ${endTime - startTime} milliseconds`)
    console.log(res);

    console.log(res[0].departmentKey);
}, 15000);

test('getting orbi E-sektionen org tree', async () => {
    let res = await api.getOrganizationNodeTree();
    console.log(res);

    console.log(res.departments.find(v => v.name === 'E-sektionen')?.social);
});