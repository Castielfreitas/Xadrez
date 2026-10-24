// Country/document metadata is produced by the secure identity endpoint. It is
// distinct from a provider's permission to accept deposits or send prize payouts.
export const COUNTRY_CODES=Object.freeze('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' '));
const countries=new Set(COUNTRY_CODES);
export const validCountry=value=>typeof value==='string'&&countries.has(value);
export const INTERNATIONAL_PENDING='Depósitos, saques e competições com entrada para identidades sem CPF ainda não estão disponíveis. Você pode jogar gratuitamente.';
export function identityAccess(record,now=Date.now()){
 const documentType=record?.documentType||'cpf';
 const identityVerified=Boolean(record?.status==='verified'&&record.sealed&&Number.isFinite(record.submittedAt)&&record.submittedAt<=now&&now-record.submittedAt<30*86400000&&(documentType!=='passport'||validDate(record.documentExpiry)&&Date.parse(record.documentExpiry+'T00:00:00Z')>now));
 const domestic=documentType==='cpf';
 return {identityVerified,documentType,financiallyEligible:identityVerified&&domestic,reason:!domestic?'international_provider_required':identityVerified?null:'identity_required'};
}
export function validDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const date=new Date(value+'T00:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;}
export function countryLabel(code,locale='pt-BR'){if(!validCountry(code))return '';try{return new Intl.DisplayNames([locale],{type:'region'}).of(code)||code;}catch{return code;}}
