export const platforms = [
 {id:"rslina",domain:"rslina.com"},
 {id:"brandlinker",domain:"brandlinkerbd.com"},
 {id:"brandlinker-dubai",domain:"brandlinkerdubai.com"},
 {id:"brandlinker-spark",domain:"brandlinkerspark.com"},
 {id:"brandlinker-studio",domain:"brandlinkerstudio.com"}
] as const;
export type PlatformId=typeof platforms[number]["id"];
export function isPlatformId(value:string):value is PlatformId{return platforms.some(p=>p.id===value);}
