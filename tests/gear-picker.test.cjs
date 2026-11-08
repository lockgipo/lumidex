const test=require('node:test'),assert=require('node:assert/strict');
const p=require('../gear-picker.js');
const equipped={key:'b:1',slot:'sword',name:'+4 III Bow',template:'bow',bonuses:{atk:26,dex:5}};
const items=[
 {key:'b:2',slot:'sword',name:'III Sword',template:'sword',source:'背包',bonuses:{atk:100,dex:20}},
 {key:'b:3',slot:'sword',name:'IV Bow',template:'bow',source:'背包',bonuses:{atk:20,dex:18,pierce:4}},
 {key:'s:1',slot:'sword',name:'III Bow',source:'倉庫',bonuses:{atk:90,dex:6}},
 {key:'b:4',slot:'sword',name:'III Cestus',source:'背包',bonuses:{atk:45,dex:15}},
 {key:'s:2',slot:'armor',name:'III Coat',source:'倉庫',bonuses:{dex:50}}
];
test('Archer uses bow only; generic sword slot does NOT imply every weapon is equipable',()=>{
 assert.equal(p.normalizeJob('ARCHER'),'archer');
 assert.equal(p.weaponType(items[0]),'sword');
 assert.equal(p.weaponType(items[3]),'cestus');
 assert.equal(p.weaponType(items[2]),'bow');
 assert.equal(p.usability(items[0],'archer'),'blocked');
 assert.equal(p.usability(items[1],'archer'),'allowed');
 assert.equal(p.usability(items[2],'archer'),'allowed');
 assert.equal(p.usability(items[3],'archer'),'blocked');
 assert.equal(p.usability(items[0],'unknown_job'),'unknown');
});
test('candidate picker filters incompatible weapons, sorts by DEX and handles same-name copies',()=>{
 const r=p.relatedCandidates(items,equipped,'archer',{sort:'dex'});
 assert.equal(r.blocked,2);
 assert.equal(r.visible.length,2);
 assert.equal(r.visible[0].key,'b:3');
 assert.equal(r.visible[1].key,'s:1');
 assert.equal(p.relatedCandidates(items,equipped,'archer',{sort:'atk',hideBlocked:false}).visible.length,4);
 assert.equal(p.relatedCandidates(items,equipped,'archer',{source:'倉庫'}).visible.length,1);
 assert.equal(p.relatedCandidates(items,equipped,'archer',{query:'物理穿透'}).visible[0].key,'b:3');
});
test('same-slot armor remains visible with unverified class restrictions',()=>{
 const armor={slot:'armor'};
 const r=p.relatedCandidates(items,armor,'archer');
 assert.equal(r.visible.length,1);
 assert.equal(p.usability(items[4],'archer'),'unknown');
});
test('stat-first info honors focus and never claims set bonuses',()=>{
 const result=p.topStats(items[1],'pierce');
 assert.deepEqual(result[0],{key:'pierce',label:'物理穿透',value:4});
 assert.ok(!Object.hasOwn(p.jobs,'sinister'));
});

test('can conservatively infer Archer from worn Bow when production proxy lacks class ID',()=>{
 assert.equal(p.inferJobFromEquipped([equipped]),'archer');
 assert.equal(p.inferJobFromEquipped([{slot:'sword',name:'III Sword'}]),'');
 assert.equal(p.inferJobFromEquipped([{slot:'sword',name:'III Cestus'}]),'');
});
