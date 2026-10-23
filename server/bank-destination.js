import {check} from './cash-ledger.js';
import {validCpf} from '../src/trust.js';
// Only domestic, same-holder bank destinations. Identity comes from server KYC.
export function bankDestination(input,identity){
 check(input&&typeof input==='object','Informe os dados bancários.');
 check(validCpf(identity?.cpf),'CPF do titular inválido.');
 const field=(key,pattern,message)=>{const value=String(input[key]??'').trim().toUpperCase();check(pattern.test(value),message);return value;};
 const code=field('bankCode',/^\d{3}$/,'Informe o código bancário de 3 dígitos.');check(code!=='000','Código bancário inválido.');
 const agency=field('agency',/^\d{1,5}$/,'Informe a agência, sem o dígito.');
 const agencyDigit=field('agencyDigit',/^[\dX]?$/,'Dígito da agência inválido.');
 const account=field('account',/^\d{1,20}$/,'Informe a conta, sem o dígito.');
 const accountDigit=field('accountDigit',/^[\dX]$/,'Informe o dígito da conta.');
 const bankAccountType=field('bankAccountType',/^(CONTA_CORRENTE|CONTA_POUPANCA)$/,'Tipo de conta inválido.');
 check(!input.country||input.country==='BR','TED disponível somente para contas no Brasil.');
 check(typeof identity.name==='string'&&identity.name.trim().length>=5,'Nome do titular inválido.');
 if(input.cpfCnpj)check(String(input.cpfCnpj).replace(/\D/g,'')===identity.cpf,'A conta deve pertencer ao titular verificado.');
 return {bank:{code},ownerName:identity.name.trim(),cpfCnpj:identity.cpf,agency,...(agencyDigit?{agencyDigit}:{}),account,accountDigit,bankAccountType};
}
const number=value=>String(value??'').replace(/^0+(?=\d)/,'');
export function sameBankDestination(expected,actual){return Boolean(actual&&
 String(actual.cpfCnpj??'').replace(/\D/g,'')===expected.cpfCnpj&&
 number(actual.bank?.code)===number(expected.bank.code)&&number(actual.agency)===number(expected.agency)&&
 String(actual.agencyDigit??'').toUpperCase()===String(expected.agencyDigit??'').toUpperCase()&&
 number(actual.account)===number(expected.account)&&String(actual.accountDigit??'').toUpperCase()===expected.accountDigit&&actual.bankAccountType===expected.bankAccountType);}
