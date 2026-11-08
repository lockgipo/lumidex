/* LumiDex equipment names: narrow display aliases for Explorer gear, no game assets. */
(function(root,factory){const api=factory(); if(typeof module==='object'&&module.exports)module.exports=api; else root.LumiGearZh=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
  const names=Object.freeze({
    'Knife':'匕首','Sword':'長劍','Hammer':'鐵鎚','Dagger Pair':'雙匕首',
    'Viper Kunai':'毒蛇苦無','Katana':'武士刀','Cestus':'拳套','Neko Flask':'貓咪藥瓶',
    'Rune Grimoire':'盧恩魔導書','Royal Tablet':'王者石板','Twin Pistols':'雙槍',
    'Lionheart Aegis':'獅心神盾','Rod':'魔杖','Staff':'法杖','Quarterstaff':'長棍','Bow':'弓',
    'Cotton Shirt':'棉布衫',"Adventurer's Suit":'冒險者服','Coat':'大衣',
    'Orb':'魔法寶珠','Catalyst':'催化瓶','Lantern':'提燈','Shuriken':'手裏劍','Saya':'刀鞘',
    'Hood':'兜帽披風','Muffler':'圍巾披風','Sandals':'涼鞋','Shoes':'鞋子',
    'Hat':'帽子','Cap':'便帽','Helm':'頭盔','Obsidian Ring':'黑曜石戒指','Emerald Ring':'祖母綠戒指',
    'Night Cloak':'夜影披風','Leather Boots':'皮靴','Platinum Ring':'白金戒指',
    'Diamond Ring':'鑽石戒指','Traveler Hat':'旅行者帽','Explorer Glasses':'探險者眼鏡',
    'Red Scarf':'紅色圍巾','Quiver':'箭袋','Ruby Ring':'紅寶石戒指',
    'Silver Ring':'銀戒指','Golden Ring':'黃金戒指'
  });
  const slots=Object.freeze({sword:'右手武器',armor:'身體',head:'頭上',face:'頭中',mouth:'頭下',garment:'披肩',shoes:'鞋子',accessory1:'飾品',accessory2:'飾品',ammo:'副手',offhand:'副手',shield:'副手'});
  const entries=Object.entries(names).sort((a,b)=>b[0].length-a[0].length);
  function translated(name){
    const original=String(name??'').trim();
    const match=original.match(/^((?:\+\d+\s+)?(?:(?:VIII|VII|VI|IV|IX|III|II|I|V|X)\s+)?)(.*)$/i);
    if(!match)return {zh:original,english:original,translated:false};
    const prefix=match[1],item=match[2];
    for(const [en,zh] of entries){if(item.toLowerCase()===en.toLowerCase())return {zh:prefix+zh,english:original,translated:true};}
    return {zh:original,english:original,translated:false};
  }
  function title(gear){return translated(gear?.name).zh;}
  function subtitle(gear){const r=translated(gear?.name);return r.translated?r.english:'';}
  function slot(slot){return slots[slot]||String(slot??'未知部位');}
  return Object.freeze({names,slots,translated,title,subtitle,slot});
});
