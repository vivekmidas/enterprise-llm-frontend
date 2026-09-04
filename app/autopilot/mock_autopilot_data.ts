/*
===============================================================================
BLOCK COMMENT: AUTOPILOT MOCK DATA ENGINE (WITH STATUTORY READY RECKONER & DOC DETAILS)
Module: frontend/app/autopilot/mock_autopilot_data.ts
Description:
    Includes statutory section ready reckoners (Summary + Verbatim Bare Act),
    extracted document clauses/OCR details, and party management structures.
===============================================================================
*/

export interface SourceRef {
  title?: string;
  doc_name?: string;
  page_or_clause?: string;
  date?: string;
}

export interface ExtractedFact {
  id: string;
  label: string;
  value: string;
  category: 'Parties' | 'Financial' | 'Contractual' | 'Procedural';
  source: SourceRef;
  verified: boolean;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  source?: SourceRef;
  event_type?:
  | 'Hearing'
  | 'Order'
  | 'Filing'
  | 'Evidence'
  | 'Notice'
  | 'Client Discussion'
  | 'Counsel Strategy'
  | 'Court Hearing'
  | 'Settlement'
  | 'General Note'
  | 'Others';
  impact_badge?: string;
  next_date?: string;
  bench_direction?: string;
  key_action?: string;
  people_involved?: string[];
}

export interface HearingRecord {
  id: string;
  hearing_date: string;
  court_bench: string;
  proceeding_stage:
  | 'Notice Returnable'
  | 'Interim Arguments'
  | 'Framing of Issues'
  | 'Evidence / Cross'
  | 'Final Hearing'
  | 'Order Reserved';
  order_summary: string;
  directions_given: string;
  next_hearing_date?: string;
  strategic_impact: string;
  remedial_action_added?: string;
}

export interface ExtractedDocClause {
  clause_number: string;
  clause_title: string;
  extracted_snippet: string;
  legal_impact: string;
}

export interface UploadedDoc {
  id: string;
  filename: string;
  doc_type: string;
  pages: number;
  date: string;
  file_size: string;
  status: 'Parsed' | 'Supplemental';
  extracted_clauses?: ExtractedDocClause[];
  raw_ocr_snippet?: string;
  associated_gaps?: string[];
  description?: string;
  tags?: string[];
  provenance?:
  | 'Client Direct Submission'
  | 'Opposing Party Production'
  | 'Court Certified Record'
  | 'Third Party / Subpoena'
  | 'Field Investigation'
  | 'Forensic / Expert Report'
  | string;
  file_ext?: 'pdf' | 'png' | 'jpg' | 'md' | 'txt' | 'docx' | string;
}

export interface CaseParty {
  id: string;
  name: string;
  role:
  | 'Claimant / Creditor'
  | 'Respondent / Debtor'
  | 'Guarantor / Director'
  | 'Witness / Site Engineer'
  | 'Arbitrator / Mediator';
  entity_type: 'Private Limited Company' | 'LLP' | 'Individual Partner' | 'Proprietorship';
  address: string;
  contact_person?: string;
  signatory?: string;
}

export type GapCategory =
  | 'Documentary'
  | 'Factual'
  | 'Procedural / Notice'
  | 'Contractual / Clause'
  | 'Limitation / Timeline';

export interface CaseGap {
  id: string;
  title: string;
  category: GapCategory;
  severity: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Partially Addressed' | 'Closed';
  plain_english_explanation: string;
  statutory_or_clause_ref: string;
  source: SourceRef;
  suggested_fix: string;
  resolution_note?: string;
  remedial_cta_label: string;
  remedial_cta_action_type: 'upload_doc' | 'draft_notice' | 'add_fact' | 'mark_resolved';
  remedial_target_template?: string;
}

export type ActionCategory =
  | 'Evidence Preservation'
  | 'Pre-Litigation'
  | 'Settlement & ADR'
  | 'Formal Proceedings'
  | 'Interim Relief';

export interface LegalAction {
  id: string;
  title: string;
  category: ActionCategory;
  short_description: string;
  prerequisites: string[];
  statutory_ref: string;
  next_procedural_steps: string[];
  feasibility_score: number;
  recommended_tag?: string;
  updated_by_enrichment?: boolean;
  draft_template_id?: string;
}

export interface HistoricalPrecedent {
  id: string;
  case_title: string;
  citation: string;
  court: string;
  coram: string;
  decision_date: string;
  status_badge: string;
  outcome_tag: string;
  similarity_score: number;
  matched_sections: string[];
  ratio_decidendi: string;
  facts_summary: string;
  petitioner_arguments: string[];
  respondent_arguments: string[];
  judge_findings: string;
}

export interface StatutoryReadyReckoner {
  section_code: string;
  short_label: string;
  act_name: string;
  aliases?: string[];
  summary_view: {
    core_legal_rule: string;
    essential_ingredients: string[];
    statutory_limitation: string;
    landmark_sc_ruling: string;
    counsel_checklist: string[];
  };
  details_view_bare_act: {
    official_heading: string;
    verbatim_text: string;
    provisos_and_explanations?: string[];
  };
}

export interface MatterCase {
  id: string; // Formatted as tenant_name-case_id (EPIC: epic_legal_case_intake_workspace.md)
  case_code: 'orion_v_delta' | 'cloudnet_v_starlight' | 'precision_v_vanguard' | string;
  case_title: string;
  case_subtitle: string;
  court_forum: string;
  claim_amount: string;
  dispute_description: string;
  matter_status: string;
  evidence_completeness: number;
  open_gaps_count: number;
  last_reviewed: string;
  parties: CaseParty[];
  statutory_sections: StatutoryReadyReckoner[];
  documents: UploadedDoc[];
  timeline: TimelineEvent[];
  facts: ExtractedFact[];
  gaps: CaseGap[];
  actions: LegalAction[];
  precedents: HistoricalPrecedent[];
  sample_enrichment_text: string;
  sample_enrichment_doc_name: string;
  enrichment_applied?: boolean;
  case_category?: string;
  next_hearing_date?: string;
  hearing_records?: HearingRecord[];
  created_at?: string;
  created_at_display?: string;
  created_by_user_id?: string;
  tenant_id?: string;
  optional_domain_fields?: Record<string, string>;
}

// -----------------------------------------------------------------------------
// STATUTORY READY RECKONER DATABASE
// -----------------------------------------------------------------------------
export const STATUTORY_RECKONER_DB: Record<string, StatutoryReadyReckoner> = {
  sec12a_cca: {
    section_code: 'sec12a_cca',
    short_label: 'Sec 12A Commercial Courts Act',
    act_name: 'Commercial Courts Act, 2015',
    summary_view: {
      core_legal_rule:
        'A commercial suit cannot be instituted in any Commercial Court without the plaintiff first exhausting mandatory Pre-Institution Mediation, unless the suit contemplates urgent interim relief.',
      essential_ingredients: [
        'Mandatory mediation before State/District Legal Services Authority (DSLSA).',
        'Timeframe: 3-month statutory mediation period (extendable by 2 months with consent).',
        'Settlement arrived at has the status of an Arbitral Award under Section 30(4) of Arbitration Act.',
        'Non-compliance warrants rejection of plaint under Order VII Rule 11 CPC.',
      ],
      statutory_limitation:
        '3 months period spent in mediation is excluded from limitation calculation per Sec 12A(3).',
      landmark_sc_ruling:
        'Patil Automation Pvt Ltd v. Rakheja Engineers Pvt Ltd, (2022) 10 SCC 1 — Supreme Court held Section 12A is mandatory and absolute.',
      counsel_checklist: [
        'Check if urgent interim injunction / attachment is prayed with bona fide urgency.',
        'If no urgent relief, file Form 1 before DSLSA along with prescribed fee.',
        'Obtain Non-Starter Report if opposite party fails to appear after two notices.',
      ],
    },
    details_view_bare_act: {
      official_heading: 'Section 12A. Pre-Institution Mediation and Settlement.',
      verbatim_text:
        '(1) A suit, which does not contemplate any urgent interim relief under this Act, shall not be instituted unless the plaintiff exhausts the remedy of pre-institution mediation in accordance with such manner and procedure as may be prescribed by rules made by the Central Government.\n\n(2) The Central Government may, by notification, authorise the Authorities constituted under the Legal Services Authorities Act, 1987, for the purposes of pre-institution mediation.\n\n(3) Notwithstanding anything contained in the Limitation Act, 1963, the period of three months spent in pre-institution mediation shall not be computed towards the period of limitation prescribed for such suit.',
      provisos_and_explanations: [
        'Provided that the period of mediation can be extended for further two months with consent of both parties.',
        'Provided further that the settlement arrived at shall have the status and effect of an arbitral award under sub-section (4) of section 30 of the Arbitration and Conciliation Act, 1996.',
      ],
    },
  },
  sec21_arb: {
    section_code: 'sec21_arb',
    short_label: 'Sec 21 Arbitration Act (DIAC)',
    act_name: 'Arbitration and Conciliation Act, 1996',
    summary_view: {
      core_legal_rule:
        'Arbitral proceedings in respect of a particular dispute commence on the date on which a request for that dispute to be referred to arbitration is received by the respondent.',
      essential_ingredients: [
        'Notice must clearly articulate the dispute, claim amount, and invoke the arbitration agreement.',
        'Commencement date stops the clock on statutory limitation under Section 43.',
        'Mandatory statutory prerequisite prior to filing Section 11(6) appointment petition before High Court.',
      ],
      statutory_limitation:
        'Section 21 notice must be served within 3 years of the accrual of the cause of action.',
      landmark_sc_ruling:
        'State of Goa v. Praveen Enterprises, (2012) 12 SCC 581 & BSNL v. Nortel Networks, (2021) 5 SCC 738.',
      counsel_checklist: [
        'Quote exact arbitration clause from the agreement.',
        'Propose 3 retired judges as Sole Arbitrator or nominate co-arbitrator.',
        'Give 30 calendar days to concur before moving High Court under Section 11(6).',
      ],
    },
    details_view_bare_act: {
      official_heading: 'Section 21. Commencement of arbitral proceedings.',
      verbatim_text:
        'Unless otherwise agreed by the parties, the arbitral proceedings in respect of a particular dispute commence on the date on which a request for that dispute to be referred to arbitration is received by the respondent.',
      provisos_and_explanations: [
        'Read with Section 43(2): For the purposes of this section and the Limitation Act, 1963, an arbitration shall be deemed to be commenced when one party serves on the other party a notice requiring him to appoint an arbitrator.',
      ],
    },
  },
  sec318_bns: {
    section_code: 'sec318_bns',
    short_label: 'Sec 318(4) BNS (formerly Sec 420 IPC)',
    act_name: 'Bharatiya Nyaya Sanhita, 2023',
    summary_view: {
      core_legal_rule:
        'Punishes cheating and dishonestly inducing delivery of property with imprisonment up to 7 years and fine. Requires fraudulent or dishonest intention existing at the inception of transaction.',
      essential_ingredients: [
        'Deception of any person by fraudulent or dishonest representation.',
        'Dishonestly inducing the person so deceived to deliver any property or valuable security.',
        'Mens rea at the time of making the promise (distinguishing civil breach from criminal cheating).',
      ],
      statutory_limitation:
        'Offence is cognizable and non-bailable; no limitation bar under Section 468 CrPC / 514 BNSS.',
      landmark_sc_ruling:
        'Hridaya Ranjan Prasad Verma v. State of Bihar, (2000) 4 SCC 168 & Vijay Kumar Ghai v. State of WB, (2022) 7 SCC 124.',
      counsel_checklist: [
        'Ensure complaint demonstrates dishonest intention at the beginning, not mere subsequent inability to pay.',
        'Corroborate with falsified purchase orders, pre-closed bank accounts, or forged delivery receipts.',
      ],
    },
    details_view_bare_act: {
      official_heading: 'Section 318. Cheating. [Sub-section (4)]',
      verbatim_text:
        '(4) Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person, or to make, alter or destroy the whole or any part of a valuable security, or anything which is signed or sealed, and which is capable of being converted into a valuable security, shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine.',
      provisos_and_explanations: [
        'Corresponds to Section 420 of the Indian Penal Code, 1860.',
        'Explanation: A dishonest concealment of facts is a deception within the meaning of this section.',
      ],
    },
  },
  sec316_bns: {
    section_code: 'sec316_bns',
    short_label: 'Sec 316(2) BNS (formerly Sec 406 IPC - CBT)',
    act_name: 'Bharatiya Nyaya Sanhita, 2023',
    summary_view: {
      core_legal_rule:
        'Punishes Criminal Breach of Trust (CBT) with imprisonment up to 5 years or fine. Occurs when entrusted property or dominion over property is dishonestly misappropriated or converted to own use.',
      essential_ingredients: [
        'Entrustment of property or dominion over property to the accused.',
        'Dishonest misappropriation, conversion, or disposal in violation of legal direction or contract.',
      ],
      statutory_limitation: 'Cognizable and non-bailable offence.',
      landmark_sc_ruling:
        'Sardar Singh v. State of Haryana, (1977) 1 SCC 463 & Dalip Kaur v. Jagnar Singh, (2009) 14 SCC 696.',
      counsel_checklist: [
        'Establish fiduciary relationship or specific consignment entrustment under bailment/consignment notes.',
      ],
    },
    details_view_bare_act: {
      official_heading: 'Section 316. Criminal breach of trust. [Sub-section (2)]',
      verbatim_text:
        '(2) Whoever commits criminal breach of trust shall be punished with imprisonment of either description for a term which may extend to five years, or with fine, or with both.\n\n(5) Whoever, being a clerk or servant or employed as a clerk or servant, and being in any manner entrusted in such capacity with property... commits criminal breach of trust, shall be punished with imprisonment for a term which may extend to seven years, and shall also be liable to fine.',
      provisos_and_explanations: [
        'Corresponds to Sections 405, 406 and 409 of the Indian Penal Code, 1860.',
      ],
    },
  },
  sec35_bnss: {
    section_code: 'sec35_bnss',
    short_label: 'Sec 35(3) BNSS (formerly Sec 41A CrPC)',
    act_name: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
    summary_view: {
      core_legal_rule:
        'Mandatory notice of appearance issued by Police Officer to accused where arrest is not required for offences punishable up to 7 years. Arrest cannot be made if accused complies with notice, unless reasons are recorded.',
      essential_ingredients: [
        'Mandatory prior notice for offences punishable with imprisonment of 7 years or less.',
        'Accused is duty bound to appear and cooperate with investigation.',
        'Failure to comply entitles IO to effect arrest subject to Magistrate orders.',
      ],
      statutory_limitation: 'Notice must provide reasonable appearance window (minimum 3-7 days).',
      landmark_sc_ruling:
        'Arnesh Kumar v. State of Bihar, (2014) 8 SCC 273 & Satender Kumar Antil v. CBI, (2022) 10 SCC 51.',
      counsel_checklist: [
        'If representing Complainant: File representation to IO demonstrating evasion of Section 35(3) notice to seek NBW.',
        'If representing Accused: Ensure written reply to Section 35(3) notice with acknowledgment stamp.',
      ],
    },
    details_view_bare_act: {
      official_heading: 'Section 35. Notice of appearance before police officer. [Sub-section (3)]',
      verbatim_text:
        '(3) The police officer shall, in all cases where the arrest of a person is not required under sub-section (1) of section 35, issue a notice directing the person against whom a reasonable complaint has been made... to appear before him or at such other place as may be specified in the notice.\n\n(4) Where such person complies and continues to comply with the notice, he shall not be arrested in respect of the offence... unless, for reasons to be recorded, the police officer is of the opinion that he ought to be arrested.',
      provisos_and_explanations: [
        'Corresponds to Section 41A of the Code of Criminal Procedure, 1973.',
      ],
    },
  },
  sec528_bnss: {
    section_code: 'sec528_bnss',
    short_label: 'Sec 528 BNSS (formerly Sec 482 CrPC - Quashing)',
    act_name: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
    summary_view: {
      core_legal_rule:
        'Saves the inherent powers of the High Court to prevent abuse of the process of any court or to secure the ends of justice. Used to quash FIRs, criminal complaints, or summoning orders.',
      essential_ingredients: [
        'High Court does not appreciate disputed facts or hold a mini-trial at 528 stage.',
        'Parameters: If uncontroverted FIR allegations do not disclose cognizable offence (*Bhajan Lal* principles).',
        'Distinction between pure civil breach of contract and criminal cheating.',
      ],
      statutory_limitation:
        'Can be invoked at FIR stage, post-charge-sheet stage, or post-summoning order stage.',
      landmark_sc_ruling:
        'State of Haryana v. Bhajan Lal, 1992 Supp (1) SCC 335 & Neeharika Infrastructure v. State of Maharashtra, (2021) 19 SCC 401.',
      counsel_checklist: [
        'For Complainant: Show specific overt acts, pre-existing intent to deceive, and forged records.',
        'For Accused: Show dispute arises solely from contractual interpretation or account reconciliations.',
      ],
    },
    details_view_bare_act: {
      official_heading: 'Section 528. Saving of inherent powers of High Court.',
      verbatim_text:
        'Nothing in this Sanhita shall be deemed to limit or affect the inherent powers of the High Court to make such orders as may be necessary to give effect to any order under this Sanhita, or to prevent abuse of the process of any Court or otherwise to secure the ends of justice.',
      provisos_and_explanations: [
        'Corresponds to Section 482 of the Code of Criminal Procedure, 1973.',
      ],
    },
  },
  sec138_ni_act: {
    section_code: 'sec138_ni_act',
    short_label: 'Sec 138 / 141 NI Act (Cheque Dishonour)',
    act_name: 'Negotiable Instruments Act, 1881',
    summary_view: {
      core_legal_rule:
        'Criminal offence for dishonour of cheque issued towards discharge of legally enforceable debt. Imprisonment up to 2 years and/or fine up to twice the cheque amount. Section 141 imposes vicarious liability on Directors in charge of business.',
      essential_ingredients: [
        'Cheque presented within validity (3 months) and returned unpaid ("Funds Insufficient" / "Account Closed").',
        'Statutory Demand Notice dispatched within 30 days of receiving return memo.',
        'Drawer fails to pay within 15 days of notice receipt.',
        'Criminal Complaint filed before Judicial Magistrate within 1 month thereafter.',
      ],
      statutory_limitation:
        'Strict statutory windows: 30 days to send notice, 15 days to pay, 30 days to file complaint.',
      landmark_sc_ruling:
        'Bir Singh v. Mukesh Kumar, (2019) 4 SCC 197 & Dashrath Rupsingh Rathod v. State of Maharashtra, (2014) 9 SCC 129.',
      counsel_checklist: [
        'Produce original cheque, bank return memo, copy of statutory notice, and India Post tracking report.',
        'Specific averment in complaint regarding active role of Directors under Section 141.',
      ],
    },
    details_view_bare_act: {
      official_heading:
        'Section 138. Dishonour of cheque for insufficiency, etc., of funds in the account.',
      verbatim_text:
        'Where any cheque drawn by a person on an account maintained by him with a banker for payment of any amount of money to another person... is returned by the bank unpaid... such person shall be deemed to have committed an offence and shall... be punished with imprisonment for a term which may extend to two years, or with fine which may extend to twice the amount of the cheque, or with both:\n\nProvided that nothing contained in this section shall apply unless—\n(a) the cheque has been presented within three months;\n(b) payee makes a demand within thirty days of information;\n(c) drawer fails to make payment within fifteen days of receipt.',
      provisos_and_explanations: [
        'Read with Section 139 (Presumption in favour of holder) and Section 141 (Company offences).',
      ],
    },
  },
  sec63_bsa: {
    section_code: 'sec63_bsa',
    short_label: 'Sec 63 BSA (formerly Sec 65B Evidence Act)',
    act_name: 'Bharatiya Sakshya Adhiniyam, 2023',
    summary_view: {
      core_legal_rule:
        'Mandates a certificate signed by the person in lawful control of the computer/device for electronic records (emails, WhatsApp, server logs) to be admissible in evidence without producing the original device.',
      essential_ingredients: [
        'Identification of electronic record containing the statement.',
        'Description of the device producing the output and regular lawful operation.',
        'Signed by a person occupying a responsible official position in relation to operation of device.',
      ],
      statutory_limitation:
        'Must be produced at the time of filing documents / affidavits in evidence.',
      landmark_sc_ruling:
        'Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal, (2020) 7 SCC 1 — Supreme Court held Section 65B certificate mandatory for electronic evidence admissibility.',
      counsel_checklist: [
        'Obtain hash checksum (SHA-256) of exported email files (.eml) or WhatsApp chats.',
        'Ensure certificate explicitly mentions operating conditions and custody of device.',
      ],
    },
    details_view_bare_act: {
      official_heading: 'Section 63. Admissibility of electronic records.',
      verbatim_text:
        '(1) Notwithstanding anything contained in this Adhiniyam, any information contained in an electronic record which is printed on a paper, stored, recorded or copied in optical or magnetic media or cloud storage shall be deemed to be also a document...\n\n(4) In any proceedings where it is desired to give a statement in evidence by virtue of this section, a certificate doing any of the following things, that is to say—\n(a) identifying the electronic record containing the statement;\n(b) describing the manner in which it was produced;\n(c) giving such particulars of any device involved...\nshall be evidence of any matter stated in the certificate.',
      provisos_and_explanations: [
        'Corresponds to Section 65B of the Indian Evidence Act, 1872.',
        'Now expressly includes semiconductor memory and cloud storage platforms.',
      ],
    },
  },
  art226_writ: {
    section_code: 'art226_writ',
    short_label: 'Article 226 Constitution (Writ Jurisdiction)',
    act_name: 'Constitution of India, 1950',
    summary_view: {
      core_legal_rule:
        'Empowers High Courts to issue directions, orders, or writs (Habeas Corpus, Mandamus, Prohibition, Quo Warranto, Certiorari) for enforcement of Fundamental Rights and for any other purpose against State and public authorities.',
      essential_ingredients: [
        'State action or policy must be arbitrary, irrational, or in violation of Articles 14, 19, or 21.',
        'Alternative efficacious remedy must either be inadequate, non-existent, or fundamentally breached principles of natural justice.',
        'Strict scrutiny of doctrine of proportionality and Wednesbury unreasonableness.',
      ],
      statutory_limitation:
        'No rigid limitation, but doctrine of laches applies if unexplained delay occurs.',
      landmark_sc_ruling:
        'Whirlpool Corporation v. Registrar of Trade Marks, (1998) 8 SCC 1 & Radha Krishan Industries v. State of HP, (2021) 6 SCC 771.',
      counsel_checklist: [
        'Establish that Respondent is "State" under Article 12 or performing public duty.',
        'Highlight jurisdictional error or patent breach of audi alteram partem in the impugned order.',
      ],
    },
    details_view_bare_act: {
      official_heading: 'Article 226. Power of High Courts to issue certain writs.',
      verbatim_text:
        '(1) Notwithstanding anything in Article 32, every High Court shall have powers... to issue to any person or authority, including in appropriate cases, any Government... directions, orders or writs, including writs in the nature of habeas corpus, mandamus, prohibition, quo warranto and certiorari, or any of them, for the enforcement of any of the rights conferred by Part III and for any other purpose.',
      provisos_and_explanations: [
        'Clause (2) allows High Courts to exercise jurisdiction if cause of action wholly or in part arises within its territory.',
      ],
    },
  },
  order39_cpc: {
    section_code: 'order39_cpc',
    short_label: 'Order 39 Rules 1 & 2 CPC (Temporary Injunction)',
    act_name: 'Code of Civil Procedure, 1908',
    summary_view: {
      core_legal_rule:
        'Grants temporary injunction to stay alienation, damage, or wastage of property in dispute until final disposal of suit, subject to the classic tripartite test.',
      essential_ingredients: [
        'Prima facie case in favour of plaintiff.',
        'Balance of convenience tilting towards grant of injunction.',
        'Irreparable injury that cannot be adequately compensated in monetary damages if relief is denied.',
      ],
      statutory_limitation: 'Filed along with Plaint or during pendency of suit.',
      landmark_sc_ruling:
        'Dalpat Kumar v. Prahlad Singh, (1992) 1 SCC 719 & Gujarat Bottling Co. Ltd. v. Coca Cola Co., (1995) 5 SCC 545.',
      counsel_checklist: [
        'Provide photographic or documentary evidence of imminent threat of alienation or construction.',
        'Comply with Order 39 Rule 3 proviso if seeking ex-parte ad-interim injunction.',
      ],
    },
    details_view_bare_act: {
      official_heading: 'Order XXXIX Rule 1. Cases in which temporary injunction may be granted.',
      verbatim_text:
        'Where in any suit it is proved by affidavit or otherwise—\n(a) that any property in dispute in a suit is in danger of being wasted, damaged or alienated by any party to the suit, or wrongfully sold in execution of a decree, or\n(b) that the defendant threatens, or intends, to remove or dispose of his property with a view to defrauding his creditors...\nthe Court may by order grant a temporary injunction to restrain such act.',
      provisos_and_explanations: ['Read with Section 151 (Inherent Powers of Court).'],
    },
  },
  /* -----------------------------------------------------------------------------
   * EPIC: epic_legal_case_intake_workspace.md
   * STORY: STORY-INTAKE-02: Intelligent Multi-Modal Legal Case Intake Workspace
   * DESIGN: Comprehensive Statutory Ready Reckoners (BNS, BNSS, BSA, CPC, Arbitration)
   * ----------------------------------------------------------------------------- */
  sec165_bns: {
    section_code: 'sec165_bns',
    short_label: 'Sec 165 BNS (Public Servant Framing Incorrect Document / IPC 218)',
    act_name: 'Bharatiya Nyaya Sanhita, 2023',
    aliases: [
      'bns 165',
      'sec 165',
      '165 bns',
      'ipc 218',
      'public servant framing incorrect document',
      'incorrect document',
      'falsification by public officer',
    ],
    summary_view: {
      core_legal_rule:
        'Punishes public servants who intentionally frame incorrect documents or electronic records with intent to cause injury or protect any person from legal punishment.',
      essential_ingredients: [
        'Accused must be a public servant charged with preparation or translation of any document or record.',
        'Document or electronic record framed in a manner known to be incorrect.',
        'Intention or knowledge that such incorrect framing will cause injury to public or any person, or save person from punishment/forfeiture.',
      ],
      statutory_limitation: 'Cognizable, bailable, triable by Court of Session.',
      landmark_sc_ruling:
        'State of Maharashtra v. Som Nath Thapa, (1996) 4 SCC 659 — Framing incorrect documents with mens rea creates direct culpability under corresponding penal sections.',
      counsel_checklist: [
        'Verify public servant status under Section 2(28) BNS.',
        'Secure certified copy or hash of original record versus manipulated record under Section 63 BSA.',
        'Examine sanction requirements under Section 218 BNSS (formerly Section 197 CrPC).',
      ],
    },
    details_view_bare_act: {
      official_heading:
        'Section 165. Public servant framing incorrect document with intent to cause injury.',
      verbatim_text:
        'Whoever, being a public servant, and being as such public servant, charged with the preparation or translation of any document or electronic record, frames, prepares or translates that document or electronic record in a manner which he knows or believes to be incorrect, intending thereby to cause or knowing it to be likely that he may thereby cause injury to any person, shall be punished with imprisonment of either description for a term which may extend to three years, or with fine, or with both.',
      provisos_and_explanations: [
        'Read with Section 163 (Public servant disobeying law with intent to cause injury).',
      ],
    },
  },
  sec111_bns: {
    section_code: 'sec111_bns',
    short_label: 'Sec 111 BNS (Organised Crime Syndicate)',
    act_name: 'Bharatiya Nyaya Sanhita, 2023',
    aliases: ['bns 111', 'sec 111', 'organised crime', 'syndicate', 'extortion', 'gangster'],
    summary_view: {
      core_legal_rule:
        'Codifies organised crime committed by individual or members of crime syndicate by use of violence, intimidation, or coercion for unlawful economic or financial advantage.',
      essential_ingredients: [
        'Continuing unlawful activity by members of an organized crime syndicate.',
        'Use of violence, threat of violence, intimidation, or other unlawful means.',
        'Objective of obtaining direct or indirect material benefit including financial advantage.',
      ],
      statutory_limitation: 'Cognizable, non-bailable, triable by Special Court.',
      landmark_sc_ruling:
        'State of Maharashtra v. Lalit Somdatta Nagpal, (2007) 4 SCC 171 — Strict evidentiary threshold for establishing continuing syndicate activity.',
      counsel_checklist: [
        'Collate prior charge sheets showing continuous unlawful activity within past 10 years.',
        'Cross-check predicate financial fraud / recovery transactions with ledger trails.',
      ],
    },
    details_view_bare_act: {
      official_heading: 'Section 111. Organised crime.',
      verbatim_text:
        '(1) Any continuing unlawful activity including kidnapping, robbery, vehicle theft, extortion, land grabbing, contract killing, economic offence, cyber-crimes having severe consequences, trafficking in persons, drugs or weapons or illicit goods or services, human trafficking for prostitution or ransom, by any person or a group of persons acting on behalf of such a syndicate, by use of violence, intimidation, coercion, or other unlawful means to obtain direct or indirect material benefit, shall constitute organised crime.',
    },
  },
  sec303_bns: {
    section_code: 'sec303_bns',
    short_label: 'Sec 303(2) BNS (Theft / formerly Sec 379 IPC)',
    act_name: 'Bharatiya Nyaya Sanhita, 2023',
    aliases: ['bns 303', 'sec 303', 'theft', 'dishonest taking', 'ipc 379'],
    summary_view: {
      core_legal_rule:
        'Punishes dishonest moving of movable property out of the possession of any person without consent with imprisonment up to 3 years or fine or community service.',
      essential_ingredients: [
        'Movable property moved dishonestly.',
        'Property taken out of possession without person\'s consent.',
        'Moving in order to such taking.',
      ],
      statutory_limitation: 'Cognizable, non-bailable, triable by any Magistrate.',
      landmark_sc_ruling: 'K.N. Mehra v. State of Rajasthan, 1957 SCR 623.',
      counsel_checklist: [
        'Establish lawful prior possession.',
        'Provide delivery challan / physical custody logs.',
      ],
    },
    details_view_bare_act: {
      official_heading: 'Section 303. Theft.',
      verbatim_text:
        '(1) Whoever, intending to take dishonestly any movable property out of the possession of any person without that person\'s consent, moves that property in order to such taking, is said to commit theft.\n(2) Whoever commits theft shall be punished with imprisonment of either description for a term which may extend to three years, or with fine, or with both.',
    },
  },
  sec61_bns: {
    section_code: 'sec61_bns',
    short_label: 'Sec 61 BNS (Criminal Conspiracy / formerly Sec 120B IPC)',
    act_name: 'Bharatiya Nyaya Sanhita, 2023',
    aliases: [
      'bns 61',
      'sec 61',
      'criminal conspiracy',
      'conspiracy',
      'ipc 120b',
      'common intention',
    ],
    summary_view: {
      core_legal_rule:
        'When two or more persons agree to do or cause to be done an illegal act or an act by illegal means, an agreement itself constitutes criminal conspiracy.',
      essential_ingredients: [
        'Agreement between two or more persons.',
        'Object of agreement is an illegal act or legal act by illegal means.',
        'Meeting of minds and overt execution trail.',
      ],
      statutory_limitation: 'Punishable in same manner as abetment of target offence.',
      landmark_sc_ruling: 'State of Maharashtra v. Som Nath Thapa, (1996) 4 SCC 659.',
      counsel_checklist: [
        'Identify common plan via communication records (WhatsApp/Emails under Section 63 BSA).',
        'Demonstrate coordinated overt steps taken by named co-accused.',
      ],
    },
    details_view_bare_act: {
      official_heading: 'Section 61. Criminal conspiracy.',
      verbatim_text:
        '(1) When two or more persons agree to do, or cause to be done—\n(a) an illegal act; or\n(b) an act which is not illegal by illegal means, such an agreement is designated a criminal conspiracy.',
    },
  },
  sec173_bnss: {
    section_code: 'sec173_bnss',
    short_label: 'Sec 173 BNSS (Registration of FIR / formerly Sec 154 CrPC)',
    act_name: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
    aliases: ['bnss 173', 'sec 173', 'fir', 'first information report', 'crpc 154', 'zero fir'],
    summary_view: {
      core_legal_rule:
        'Mandatory registration of First Information Report (FIR) upon receiving information relating to commission of a cognizable offence, including electronic transmission with 3 days sign-off.',
      essential_ingredients: [
        'Information discloses cognizable offence.',
        'Officer in charge of Police Station has statutory duty to reduce to writing and enter in station diary.',
        'Mandatory preliminary inquiry within 14 days for offences punishable between 3 and 7 years.',
      ],
      statutory_limitation: 'Mandatory FIR registration immediately or post 14-day inquiry.',
      landmark_sc_ruling:
        'Lalita Kumari v. Govt. of U.P., (2014) 2 SCC 1 — Supreme Court held registration of FIR is mandatory if cognizable offence is disclosed.',
      counsel_checklist: [
        'Attach formal complaint addressed to SHO / DCP.',
        'Ensure electronic report is signed within three days per Section 173(1) proviso.',
        'Track Preliminary Inquiry report within 14 days statutory limit.',
      ],
    },
    details_view_bare_act: {
      official_heading: 'Section 173. Information in cognizable cases.',
      verbatim_text:
        '(1) Every information relating to the commission of a cognizable offence, if given orally to an officer in charge of a police station, shall be reduced to writing by him or under his direction, and be read over to the informant...\nProvided that if the information is given by the woman against whom an offence under section 64... is alleged to have been committed, such information shall be recorded, by a woman police officer...',
    },
  },
  sec175_bnss: {
    section_code: 'sec175_bnss',
    short_label: 'Sec 175(3) BNSS (Magistrate Directing FIR / formerly Sec 156(3) CrPC)',
    act_name: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
    aliases: [
      'bnss 175',
      'sec 175',
      'crpc 156(3)',
      'crpc 156',
      'magistrate investigation',
      'direct fir',
    ],
    summary_view: {
      core_legal_rule:
        'Empowers Judicial Magistrate to order police investigation upon an application supported by affidavit after failure of police to register FIR under Section 173(4).',
      essential_ingredients: [
        'Applicant must have exhausted remedy before SHO and Superintendent of Police under Section 173.',
        'Mandatory sworn affidavit filed in support of application (Priyanka Srivastava doctrine).',
        'Magistrate considers police status report (Action Taken Report - ATR).',
      ],
      statutory_limitation: 'Filed before jurisdictional Metropolitan Magistrate / JMFC.',
      landmark_sc_ruling:
        'Priyanka Srivastava v. State of U.P., (2015) 6 SCC 287 — Affidavit mandatory to prevent abuse of magisterial investigation.',
      counsel_checklist: [
        'Attach postal receipts of Section 173(4) representation sent to DCP/SP.',
        'Draft affidavit conforming to Section 175(3) BNSS requirements.',
      ],
    },
    details_view_bare_act: {
      official_heading: 'Section 175. Police officer’s power to investigate cognizable case.',
      verbatim_text:
        '(3) Any Magistrate empowered under section 210 may, after considering the application supported by an affidavit and the submissions of the officer in charge of the police station, order such an investigation as above-mentioned.',
    },
  },
  sec65_bsa: {
    section_code: 'sec65_bsa',
    short_label: 'Sec 65 BSA (Secondary Evidence Admissibility)',
    act_name: 'Bharatiya Sakshya Adhiniyam, 2023',
    aliases: ['bsa 65', 'sec 65', 'secondary evidence', 'certified copies', 'lost original'],
    summary_view: {
      core_legal_rule:
        'Prescribes specific situations when secondary evidence (certified copies, copies made from original by mechanical processes) may be given in proof of existence, condition, or contents of a document.',
      essential_ingredients: [
        'Original is shown or appears to be in possession of opposing party or out of reach.',
        'Original has been destroyed or lost without fault of applicant.',
        'Document is of such a nature as not to be easily movable.',
      ],
      statutory_limitation: 'Admissibility subject to proof of foundation.',
      landmark_sc_ruling: 'J. Yashoda v. K. Shobha Rani, (2007) 5 SCC 730.',
      counsel_checklist: [
        'File formal application detailing diligent search made for missing original.',
        'Verify certification standards under Section 65 BSA.',
      ],
    },
    details_view_bare_act: {
      official_heading:
        'Section 65. Cases in which secondary evidence relating to documents may be given.',
      verbatim_text:
        'Secondary evidence may be given of the existence, condition, or contents of a document in the following cases:—\n(a) when the original is shown or appears to be in the possession or power of the person against whom the document is sought to be proved...\n(b) when the existence, condition or contents of the original have been proved to be admitted in writing...',
    },
  },
  sec24_bsa: {
    section_code: 'sec24_bsa',
    short_label: 'Sec 24 BSA (Admissions in Civil & Commercial Suits)',
    act_name: 'Bharatiya Sakshya Adhiniyam, 2023',
    aliases: [
      'bsa 24',
      'sec 24',
      'admission',
      'admission of liability',
      'written statement admission',
      'concession',
    ],
    summary_view: {
      core_legal_rule:
        'Admissions are relevant and may be proved as against the person who makes them, or his representative in interest, but cannot be proved on his behalf.',
      essential_ingredients: [
        'Statement oral, documentary, or electronic which suggests inference as to any fact in issue or relevant fact.',
        'Made by party to proceedings or agent authorised.',
        'Establishes admission of liability, debt, or acceptance of goods.',
      ],
      statutory_limitation: 'Read with Order XII Rule 6 CPC (Judgment on Admissions).',
      landmark_sc_ruling: 'Nagindas Ramdas v. Dalpatram Ichharam, (1974) 1 SCC 242.',
      counsel_checklist: [
        'Highlight written admissions in email correspondence and balance confirmations.',
        'Cross-reference with Section 63 BSA electronic hash certificates.',
      ],
    },
    details_view_bare_act: {
      official_heading: 'Section 24. Admission defined.',
      verbatim_text:
        'An admission is a statement, oral or documentary or contained in electronic form, which suggests any inference as to any fact in issue or relevant fact, and which is made by any of the persons, and under the circumstances, hereinafter mentioned.',
    },
  },
  order37_cpc: {
    section_code: 'order37_cpc',
    short_label: 'Order 37 CPC (Summary Suit for Debt Recovery)',
    act_name: 'Code of Civil Procedure, 1908',
    aliases: [
      'order 37',
      'order xxxvii',
      'cpc order 37',
      'summary suit',
      'debt recovery',
      'leave to defend',
    ],
    summary_view: {
      core_legal_rule:
        'Expedited summary procedure for recovery of debts or liquidated commercial demands arising upon written contracts, bills of exchange, hundies, or promissory notes.',
      essential_ingredients: [
        'Suit strictly based on written contract, bill of exchange, promissory note, or enactment where sum is fixed.',
        'Defendant cannot defend suit as of right; must enter appearance within 10 days of summons.',
        'Defendant must seek leave to defend by showing substantial or triable defence.',
      ],
      statutory_limitation:
        'Summons for Judgment served after appearance; 10 days for leave application.',
      landmark_sc_ruling:
        'IDBI Trusteeship Services Ltd v. Hubtown Ltd, (2017) 1 SCC 568 — Quadruple principles governing unconditional leave versus conditional deposit.',
      counsel_checklist: [
        'Verify signed contract, purchase order, and counter-signed delivery challans.',
        'Serve Summons for Judgment in Form 4A, Appendix B.',
      ],
    },
    details_view_bare_act: {
      official_heading: 'Order XXXVII Rule 1. Application of Order.',
      verbatim_text:
        'Subject to the provisions of sub-rule (2), this Order shall apply to the following Courts, namely:—\n(a) High Courts, City Civil Courts and Courts of Small Causes; and\n(b) other Courts...\n(2) Subject to the provisions of sub-rule (1), the Order applies to the following classes of suits, namely:—\n(a) suits upon bills of exchange, hundies and promissory notes;\n(b) suits in which the plaintiff seeks only to recover a debt or liquidated demand in money...',
    },
  },
  sec9_arb: {
    section_code: 'sec9_arb',
    short_label: 'Sec 9 Arbitration Act (Interim Measures by Court)',
    act_name: 'Arbitration and Conciliation Act, 1996',
    aliases: [
      'sec 9 arb',
      'section 9',
      'interim relief',
      'asset freeze',
      'status quo',
      'preservation of goods',
    ],
    summary_view: {
      core_legal_rule:
        'Enables party to apply to Court before, during, or after arbitral award for interim protection, preservation, custody, or sale of disputed goods, or securing amount in dispute.',
      essential_ingredients: [
        'Existence of valid arbitration agreement.',
        'Urgent necessity to secure goods or monetary assets before constitution of tribunal.',
        'Arbitral proceedings must be commenced within 90 days from order if passed pre-arbitration.',
      ],
      statutory_limitation:
        'Must issue Section 21 notice within 90 days of Section 9 interim relief.',
      landmark_sc_ruling:
        'Firm Ashok Traders v. Gurumukh Das Saluja, (2004) 3 SCC 155 & ArcelorMittal Nippon Steel v. Essar Bulk Terminal, (2022) 1 SCC 712.',
      counsel_checklist: [
        'Demonstrate apprehension of asset siphoning or disposal by opposite party.',
        'Confirm readiness to initiate arbitration within statutory 90-day window.',
      ],
    },
    details_view_bare_act: {
      official_heading: 'Section 9. Interim measures, etc., by Court.',
      verbatim_text:
        '(1) A party may, before or during arbitral proceedings or at any time after the making of the arbitral award but before it is enforced in accordance with section 36, apply to a Court:—\n(i) for the appointment of a guardian...\n(ii) for an interim measure of protection in respect of...\n(b) securing the amount in dispute in the arbitration...',
    },
  },
  sec34_arb: {
    section_code: 'sec34_arb',
    short_label: 'Sec 34 Arbitration Act (Setting Aside Arbitral Award)',
    act_name: 'Arbitration and Conciliation Act, 1996',
    aliases: [
      'sec 34 arb',
      'section 34',
      'challenge award',
      'patent illegality',
      'public policy',
      'set aside award',
    ],
    summary_view: {
      core_legal_rule:
        'Recourse to a Court against an arbitral award may be made only by an application for setting aside such award in accordance with sub-section (2) and sub-section (2A) on strictly limited grounds.',
      essential_ingredients: [
        'Incapacity of party or invalidity of arbitration agreement.',
        'Party was not given proper notice of arbitrator appointment or proceedings.',
        'Award deals with dispute not contemplated or exceeds terms of submission.',
        'Patent illegality appearing on face of award (domestic arbitrations).',
      ],
      statutory_limitation:
        'Strict 3 months from receipt of award + 30 days condonable grace period only.',
      landmark_sc_ruling:
        'Associate Builders v. DDA, (2015) 3 SCC 49 & Ssangyong Engineering & Construction v. NHAI, (2019) 15 SCC 131.',
      counsel_checklist: [
        'Verify date of receipt of signed arbitral award.',
        'Confirm pre-deposit requirements under Section 19 of MSMED Act if applicable.',
      ],
    },
    details_view_bare_act: {
      official_heading: 'Section 34. Application for setting aside arbitral award.',
      verbatim_text:
        '(1) Recourse to a Court against an arbitral award may be made only by an application for setting aside such award in accordance with sub-section (2) and sub-section (3)...\n(3) An application for setting aside may not be made after three months have elapsed from the date on which the party making that application had received the arbitral award...',
    },
  },
  sec141_ni_act: {
    section_code: 'sec141_ni_act',
    short_label: 'Sec 141 NI Act (Cheque Bounce - Corporate Liability)',
    act_name: 'Negotiable Instruments Act, 1881',
    aliases: [
      'sec 141',
      'ni 141',
      '141 ni',
      'vicarious liability',
      'director liability',
      'signatory',
      'cheque bounce company',
    ],
    summary_view: {
      core_legal_rule:
        'Where offence under Section 138 is committed by a company, every person who was in charge of and responsible to the company for conduct of business is deemed guilty along with the company.',
      essential_ingredients: [
        'Company must be arraigned as primary accused (Aneeta Hada doctrine).',
        'Specific averment in complaint that director was in charge of day-to-day business at time of commission.',
        'Signatory of cheque is deemed liable without requiring separate averments.',
      ],
      statutory_limitation:
        'Must be arraigned in Section 138 complaint within 30 days of notice expiry.',
      landmark_sc_ruling:
        'Aneeta Hada v. Godfather Travels & Tours Pvt Ltd, (2012) 5 SCC 661 & Sunita Palita v. Panchami Stone Quarry, (2022) 10 SCC 152.',
      counsel_checklist: [
        'Procure MCA Form DIR-12 and Company Master Data confirming active directorship.',
        'Insert specific factual averment attributing active role in dishonoured transaction.',
      ],
    },
    details_view_bare_act: {
      official_heading: 'Section 141. Offences by companies.',
      verbatim_text:
        '(1) If the person committing an offence under section 138 is a company, every person who, at the time the offence was committed, was in charge of, and was responsible to, the company for the conduct of the business of the company, as well as the company, shall be deemed to be guilty of the offence and shall be liable to be proceeded against and punished accordingly.',
    },
  },
  art32_const: {
    section_code: 'art32_const',
    short_label: 'Article 32 Constitution (Supreme Court Writ Jurisdiction)',
    act_name: 'Constitution of India, 1950',
    aliases: [
      'art 32',
      'article 32',
      'supreme court writ',
      'fundamental rights',
      'habeas corpus',
      'mandamus',
      'pil',
    ],
    summary_view: {
      core_legal_rule:
        'Right to move the Supreme Court by appropriate proceedings for enforcement of Part III Fundamental Rights is itself guaranteed as a fundamental right.',
      essential_ingredients: [
        'Direct violation of Fundamental Right (Articles 14, 19, 21).',
        'State action or legislation impinging upon constitutional core without legislative authority.',
        'Explanation as to why High Court under Article 226 was not first approached.',
      ],
      statutory_limitation: 'No formal statutory limitation, subject to doctrine of laches.',
      landmark_sc_ruling:
        'Romesh Thappar v. State of Madras, 1950 SCR 594 & Daryao v. State of U.P., (1962) 1 SCR 574.',
      counsel_checklist: [
        'Establish locus standi or Public Interest Litigation (PIL) compliance.',
        'Frame explicit prayer for prerogative writ (Certiorari / Mandamus / Prohibition).',
      ],
    },
    details_view_bare_act: {
      official_heading:
        'Article 32. Remedies for enforcement of rights conferred by this Part.',
      verbatim_text:
        '(1) The right to move the Supreme Court by appropriate proceedings for the enforcement of the rights conferred by this Part is guaranteed.\n(2) The Supreme Court shall have power to issue directions or orders or writs, including writs in the nature of habeas corpus, mandamus, prohibition, quo warranto and certiorari, whichever may be appropriate, for the enforcement of any of the rights conferred by this Part.',
    },
  },
};

/* -----------------------------------------------------------------------------
 * EPIC: epic_legal_case_intake_workspace.md
 * STORY: STORY-INTAKE-02: Intelligent Multi-Modal Legal Case Intake Workspace
 * DESIGN: Configurable Domain Schema Optional Fields Catalog
 * ----------------------------------------------------------------------------- */
export interface ConfiguredDomainField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'select' | 'number' | 'date';
  options?: string[];
  description: string;
  applicableCategories: Array<'commercial' | 'criminal' | 'constitutional' | 'arbitration' | 'civil'>;
  defaultForCategories: Array<'commercial' | 'criminal' | 'constitutional' | 'arbitration' | 'civil'>;
}

export const CONFIGURED_DOMAIN_FIELDS_CATALOG: ConfiguredDomainField[] = [
  {
    key: 'claim_valuation',
    label: 'Disputed Valuation / Claim Amount',
    placeholder: 'e.g. ₹92,00,000 (Principal + 18% Interest)',
    type: 'text',
    description: 'Monetary claim or fraud quantum (can be removed if not relevant for writs or quashing)',
    applicableCategories: ['commercial', 'criminal', 'arbitration', 'civil'],
    defaultForCategories: ['commercial', 'arbitration', 'civil'],
  },
  {
    key: 'police_jurisdiction',
    label: 'Police Station / Investigating Agency',
    placeholder: 'e.g. PS Economic Offences Wing (EOW), New Delhi',
    type: 'text',
    description: 'Jurisdictional police station or regulatory investigation agency',
    applicableCategories: ['criminal', 'commercial'],
    defaultForCategories: ['criminal'],
  },
  {
    key: 'coram_presiding',
    label: 'Adjudicating Coram / Presiding Judge',
    placeholder: 'e.g. Chief Metropolitan Magistrate (CMM) / Commercial Bench',
    type: 'text',
    description: 'Name of judicial magistrate, bench, or arbitrator',
    applicableCategories: ['commercial', 'criminal', 'constitutional', 'arbitration', 'civil'],
    defaultForCategories: ['commercial', 'criminal', 'constitutional', 'arbitration', 'civil'],
  },
  {
    key: 'court_level',
    label: 'Court / Forum Hierarchy',
    placeholder: 'Select hierarchy level',
    type: 'select',
    options: [
      'Magistrate Court (CMM / ACMM)',
      'District / Commercial Court',
      'Sessions Court (Special Judge / ASJ)',
      'High Court (Single Judge)',
      'High Court (Division Bench)',
      'Supreme Court of India',
      'Sole Arbitrator Tribunal',
      '3-Member Arbitral Tribunal',
    ],
    description: 'Judicial hierarchy level for jurisdiction & appellate routing',
    applicableCategories: ['commercial', 'criminal', 'constitutional', 'arbitration', 'civil'],
    defaultForCategories: ['commercial', 'criminal', 'constitutional', 'arbitration', 'civil'],
  },
  {
    key: 'court_complex',
    label: 'Court Complex / Location',
    placeholder: 'e.g. Tis Hazari Courts, Central District, Delhi',
    type: 'text',
    description: 'Physical or virtual seat of court/forum',
    applicableCategories: ['commercial', 'criminal', 'constitutional', 'arbitration', 'civil'],
    defaultForCategories: ['commercial', 'criminal', 'constitutional', 'arbitration', 'civil'],
  },
  {
    key: 'secondary_reference',
    label: 'Secondary Reference (FIR / Contract / PPA / Gazette)',
    placeholder: 'e.g. FIR No. 142/2026 or Contract Ref SC-902',
    type: 'text',
    description: 'Secondary citation, contract clause reference, or police complaint number',
    applicableCategories: ['commercial', 'criminal', 'constitutional', 'arbitration', 'civil'],
    defaultForCategories: ['commercial', 'criminal', 'arbitration'],
  },
  {
    key: 'limitation_date',
    label: 'Statutory Limitation / Filing Deadline',
    placeholder: 'YYYY-MM-DD',
    type: 'date',
    description: 'Prescribed deadline under Limitation Act or statutory notice window',
    applicableCategories: ['commercial', 'criminal', 'arbitration', 'civil'],
    defaultForCategories: [],
  },
  {
    key: 'adr_reference',
    label: 'Pre-Institution Mediation / ADR Docket No.',
    placeholder: 'e.g. DSLSA Form 1 Ref: MED-2026/041',
    type: 'text',
    description: 'Section 12A Commercial Courts Act non-starter report or mediation docket',
    applicableCategories: ['commercial', 'arbitration', 'civil'],
    defaultForCategories: [],
  },
  {
    key: 'interim_relief',
    label: 'Interim Relief / Status Quo Urgency',
    placeholder: 'e.g. Order 39 ex-parte injunction or Sec 9 asset freeze',
    type: 'text',
    description: 'Immediate ex-parte relief or status-quo prayers',
    applicableCategories: ['commercial', 'constitutional', 'arbitration', 'civil'],
    defaultForCategories: [],
  },
  {
    key: 'opposite_counsel',
    label: 'Opposite Counsel / External Law Firm',
    placeholder: 'e.g. M/s Trilegal / Advocate on Record',
    type: 'text',
    description: 'Representing legal counsel for opposite party',
    applicableCategories: ['commercial', 'criminal', 'constitutional', 'arbitration', 'civil'],
    defaultForCategories: [],
  },
  {
    key: 'billing_code',
    label: 'Internal Client / Matter Billing Code',
    placeholder: 'e.g. MAT-DLH-2026-042',
    type: 'text',
    description: 'Enterprise ERP / Timesheet matter reference code',
    applicableCategories: ['commercial', 'criminal', 'constitutional', 'arbitration', 'civil'],
    defaultForCategories: [],
  },
];

/* -----------------------------------------------------------------------------
 * EPIC: epic_legal_case_intake_workspace.md
 * STORY: STORY-INTAKE-02: Intelligent Multi-Modal Legal Case Intake Workspace
 * DESIGN: Extraction Profile Prompt Schema & Intelligent Legal Intake Extractor
 * ----------------------------------------------------------------------------- */
export interface ExtractionProfilePrompt {
  profile_id: string;
  name: string;
  system_instruction: string;
  target_fields: string[];
}

export interface IntakeExtractionResult {
  headline: string;
  caseCategory: 'commercial' | 'criminal' | 'constitutional' | 'arbitration' | 'civil';
  initiatingParty: string;
  opposingParty: string;
  sections: string[]; // section_code matches from STATUTORY_RECKONER_DB
  forumOrCourt?: string;
  claimOrDisputedValue?: string;
  secondaryReference?: string;
  disputeDescription?: string;
  policeJurisdiction?: string;
  coramBench?: string;
  activeOptionalKeys: string[];
  optionalFieldValues: Record<string, string>;
  confidenceScore: number;
}

export const DEFAULT_INTAKE_EXTRACTION_PROFILE: ExtractionProfilePrompt = {
  profile_id: 'default_legal_intake_v1',
  name: 'Standard Indian Jurisprudence Intake Profile',
  system_instruction:
    'Extract structured case intake fields from the matter text or document extract: case category, matter headline, initiating and opposing parties, statutory sections/articles (BNS, BNSS, BSA, CPC, Arbitration Act, NI Act), forum, value, police jurisdiction, and optional domain fields.',
  target_fields: [
    'case_category',
    'matter_headline',
    'initiating_party',
    'opposing_party',
    'statutory_sections',
    'disputed_value',
    'forum_or_court',
    'police_jurisdiction',
    'secondary_reference',
  ],
};

/**
 * Intelligent client-side intake extraction engine.
 * Parses brief text, pasted extracts, or document file metadata.
 * Returns structured fields or null if content lacks sufficient legal signal.
 */
export function extractIntakeDetails(
  briefText: string,
  attachedFiles: Array<{ name: string; size?: string } | string> = [],
  categoryHint?: 'commercial' | 'criminal' | 'constitutional' | 'arbitration' | 'civil',
): IntakeExtractionResult | null {
  const combinedText = [
    briefText.trim(),
    ...attachedFiles.map((f) => (typeof f === 'string' ? f : f.name)),
  ].join(' ');

  if (combinedText.length < 12) {
    return null;
  }

  const lower = combinedText.toLowerCase();

  const hasLegalKeywords =
    lower.includes('v.') ||
    lower.includes('vs.') ||
    lower.includes('versus') ||
    lower.includes('bns') ||
    lower.includes('bnss') ||
    lower.includes('bsa') ||
    lower.includes('ipc') ||
    lower.includes('crpc') ||
    lower.includes('cpc') ||
    lower.includes('sec') ||
    lower.includes('section') ||
    lower.includes('article') ||
    lower.includes('court') ||
    lower.includes('fir') ||
    lower.includes('police') ||
    lower.includes('arbitrat') ||
    lower.includes('cheque') ||
    lower.includes('claim') ||
    lower.includes('invoice') ||
    lower.includes('agreement') ||
    lower.includes('contract') ||
    lower.includes('dispute') ||
    lower.includes('recovery') ||
    lower.includes('notice');

  if (!hasLegalKeywords && combinedText.length < 30) {
    return null;
  }

  // 1. Detect Category
  let detectedCategory: 'commercial' | 'criminal' | 'constitutional' | 'arbitration' | 'civil' =
    categoryHint || 'commercial';

  if (
    lower.includes('fir') ||
    lower.includes('police') ||
    lower.includes('accused') ||
    lower.includes('cheating') ||
    lower.includes('bns') ||
    lower.includes('crpc') ||
    lower.includes('bail') ||
    lower.includes('cognizable') ||
    lower.includes('cbt') ||
    lower.includes('318') ||
    lower.includes('316') ||
    lower.includes('165') ||
    lower.includes('138')
  ) {
    detectedCategory = 'criminal';
  } else if (
    lower.includes('arbitrat') ||
    lower.includes('diac') ||
    lower.includes('mcia') ||
    lower.includes('tribunal') ||
    lower.includes('sec 21') ||
    lower.includes('section 9') ||
    lower.includes('sec 34')
  ) {
    detectedCategory = 'arbitration';
  } else if (
    lower.includes('writ') ||
    lower.includes('article 226') ||
    lower.includes('art 226') ||
    lower.includes('article 32') ||
    lower.includes('mandamus') ||
    lower.includes('certiorari') ||
    lower.includes('fundamental right')
  ) {
    detectedCategory = 'constitutional';
  } else if (
    lower.includes('order 39') ||
    lower.includes('order 37') ||
    lower.includes('civil suit') ||
    lower.includes('partition') ||
    lower.includes('eviction') ||
    lower.includes('specific performance')
  ) {
    detectedCategory = 'civil';
  } else {
    detectedCategory = categoryHint || 'commercial';
  }

  // 2. Detect Statutory Sections
  const matchedSectionCodes = new Set<string>();

  Object.values(STATUTORY_RECKONER_DB).forEach((sec) => {
    if (sec.aliases) {
      for (const alias of sec.aliases) {
        if (lower.includes(alias.toLowerCase())) {
          matchedSectionCodes.add(sec.section_code);
          break;
        }
      }
    }
    if (lower.includes(sec.section_code.replace(/_/g, ' '))) {
      matchedSectionCodes.add(sec.section_code);
    }
  });

  if (detectedCategory === 'criminal') {
    if (
      lower.includes('cheque') ||
      lower.includes('dishonour') ||
      lower.includes('bounce') ||
      lower.includes('138')
    ) {
      matchedSectionCodes.add('sec138_ni_act');
      matchedSectionCodes.add('sec141_ni_act');
    }
    if (
      lower.includes('cheating') ||
      lower.includes('inducement') ||
      lower.includes('fraud') ||
      lower.includes('420') ||
      lower.includes('318')
    ) {
      matchedSectionCodes.add('sec318_bns');
    }
    if (
      lower.includes('cbt') ||
      lower.includes('trust') ||
      lower.includes('misappropriation') ||
      lower.includes('316')
    ) {
      matchedSectionCodes.add('sec316_bns');
    }
    if (
      lower.includes('165') ||
      lower.includes('public servant') ||
      lower.includes('incorrect document') ||
      lower.includes('218')
    ) {
      matchedSectionCodes.add('sec165_bns');
    }
    if (
      lower.includes('fir') ||
      lower.includes('police') ||
      lower.includes('173') ||
      lower.includes('154')
    ) {
      matchedSectionCodes.add('sec173_bnss');
    }
    if (
      lower.includes('electronic') ||
      lower.includes('whatsapp') ||
      lower.includes('email') ||
      lower.includes('certificate')
    ) {
      matchedSectionCodes.add('sec63_bsa');
    }
    if (matchedSectionCodes.size === 0) {
      matchedSectionCodes.add('sec318_bns');
      matchedSectionCodes.add('sec35_bnss');
      matchedSectionCodes.add('sec63_bsa');
    }
  } else if (detectedCategory === 'commercial') {
    matchedSectionCodes.add('sec12a_cca');
    matchedSectionCodes.add('sec63_bsa');
    if (lower.includes('summary') || lower.includes('liquidated') || lower.includes('order 37')) {
      matchedSectionCodes.add('order37_cpc');
    }
    if (lower.includes('arbitrat') || lower.includes('clause')) {
      matchedSectionCodes.add('sec21_arb');
    }
  } else if (detectedCategory === 'arbitration') {
    matchedSectionCodes.add('sec21_arb');
    if (
      lower.includes('interim') ||
      lower.includes('freeze') ||
      lower.includes('injunction') ||
      lower.includes('sec 9')
    ) {
      matchedSectionCodes.add('sec9_arb');
    }
    if (lower.includes('set aside') || lower.includes('challenge') || lower.includes('sec 34')) {
      matchedSectionCodes.add('sec34_arb');
    }
    matchedSectionCodes.add('sec63_bsa');
  } else if (detectedCategory === 'constitutional') {
    if (
      lower.includes('supreme court') ||
      lower.includes('art 32') ||
      lower.includes('article 32')
    ) {
      matchedSectionCodes.add('art32_const');
    } else {
      matchedSectionCodes.add('art226_writ');
    }
  } else if (detectedCategory === 'civil') {
    matchedSectionCodes.add('order39_cpc');
    if (lower.includes('admission') || lower.includes('concession')) {
      matchedSectionCodes.add('sec24_bsa');
    }
  }

  // 3. Extract Financial Valuation / Claim Amount
  let extractedValuation = '';
  const valMatch =
    combinedText.match(
      /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?\s*(?:cr(?:ore)?s?|l(?:akh)?s?|k)?)/i,
    ) || combinedText.match(/(\d+(?:\.\d+)?\s*(?:cr(?:ore)?s?|l(?:akh)?s?))/i);
  if (valMatch) {
    extractedValuation = valMatch[0].trim();
    if (
      !extractedValuation.startsWith('₹') &&
      !extractedValuation.toLowerCase().startsWith('rs') &&
      !extractedValuation.toLowerCase().startsWith('inr')
    ) {
      extractedValuation = `₹${extractedValuation}`;
    }
  }

  // 4. Extract Parties
  let initiatingParty = '';
  let opposingParty = '';

  const vMatch = combinedText.match(
    /([A-Z][A-Za-z0-9\s.,&'-]+?)\s+(?:v\.|vs\.|versus)\s+([A-Z][A-Za-z0-9\s.,&'-]+?)(?=[,\n\.;\-–—]|$)/,
  );
  if (vMatch && vMatch[1].trim().length > 2 && vMatch[2].trim().length > 2) {
    initiatingParty = vMatch[1].trim();
    opposingParty = vMatch[2].trim();
  } else {
    const compMatch = combinedText.match(
      /(?:complainant|petitioner|claimant|plaintiff)[:\s]+([A-Z][A-Za-z0-9\s.,&'-]+?)(?=[,\n\.;\-–—]|$)/i,
    );
    const accMatch = combinedText.match(
      /(?:accused|respondent|defendant)[:\s]+([A-Z][A-Za-z0-9\s.,&'-]+?)(?=[,\n\.;\-–—]|$)/i,
    );
    if (compMatch) initiatingParty = compMatch[1].trim();
    if (accMatch) opposingParty = accMatch[1].trim();
  }

  if (!initiatingParty) {
    initiatingParty =
      detectedCategory === 'criminal'
        ? 'State of NCT of Delhi (Complainant)'
        : detectedCategory === 'constitutional'
          ? 'Aggrieved Petitioner'
          : 'Initiating Corporate Entity';
  }
  if (!opposingParty) {
    opposingParty =
      detectedCategory === 'criminal'
        ? 'Named Accused & Managing Director'
        : detectedCategory === 'constitutional'
          ? 'Union of India / State Authority'
          : 'Opposing Commercial Entity LLP';
  }

  // 5. Extract Headline
  let headline = '';
  if (initiatingParty && opposingParty) {
    const topicSummary = extractedValuation
      ? `(${extractedValuation} ${detectedCategory === 'criminal' ? 'Dishonour & Fraud Matter' : 'Commercial Claim'})`
      : `(${detectedCategory.toUpperCase()} Dispute)`;
    headline = `${initiatingParty} v. ${opposingParty} ${topicSummary}`;
  } else {
    headline = briefText.split(/[.\n]/)[0].trim() || 'New Legal Dispute Workspace';
  }

  // 6. Domain-specific fields
  let policeJurisdiction = '';
  const policeMatch =
    combinedText.match(
      /(?:ps|police station|station)[:\s]+([A-Za-z0-9\s.,&'-]+?)(?=[,\n\.;\-–—]|$)/i,
    ) ||
    combinedText.match(/(?:economic offences wing|eow|cyber cell|crime branch)/i);
  if (policeMatch) {
    policeJurisdiction = policeMatch[0].trim();
  } else if (detectedCategory === 'criminal') {
    policeJurisdiction = 'PS Economic Offences Wing (EOW), New Delhi';
  }

  let forumOrCourt = '';
  if (lower.includes('supreme court')) {
    forumOrCourt = 'Supreme Court of India, New Delhi';
  } else if (
    lower.includes('high court') ||
    lower.includes('delhi high court') ||
    lower.includes('bombay high court')
  ) {
    forumOrCourt = 'High Court of Delhi, New Delhi';
  } else if (lower.includes('diac') || lower.includes('arbitrat')) {
    forumOrCourt = 'Delhi International Arbitration Centre (DIAC)';
  } else if (lower.includes('patiala house')) {
    forumOrCourt = 'Commercial Court, Patiala House Courts, New Delhi';
  } else if (lower.includes('tis hazari') || detectedCategory === 'criminal') {
    forumOrCourt = 'Court of Chief Metropolitan Magistrate (CMM), Tis Hazari Courts, Delhi';
  } else {
    forumOrCourt = 'Commercial Court, Patiala House Courts, New Delhi';
  }

  let secondaryRef = '';
  const firMatch = combinedText.match(/fir\s*(?:no\.?)?\s*[\w\d\/]+/i);
  const contractMatch = combinedText.match(/contract\s*(?:no\.?|ref\.?)?\s*[\w\d\/-]+/i);
  if (firMatch) secondaryRef = firMatch[0].trim();
  else if (contractMatch) secondaryRef = contractMatch[0].trim();
  else if (detectedCategory === 'criminal') secondaryRef = 'FIR No. 142/2026, PS EOW Central';
  else secondaryRef = 'Contract Ref: SC-2026/COM';

  // Build active optional fields & values
  const activeOptionalKeys: string[] = [];
  const optionalFieldValues: Record<string, string> = {};

  if (extractedValuation && detectedCategory !== 'constitutional') {
    activeOptionalKeys.push('claim_valuation');
    optionalFieldValues['claim_valuation'] = extractedValuation;
  }
  if (policeJurisdiction) {
    activeOptionalKeys.push('police_jurisdiction');
    optionalFieldValues['police_jurisdiction'] = policeJurisdiction;
  }
  if (forumOrCourt) {
    activeOptionalKeys.push('court_complex');
    optionalFieldValues['court_complex'] = forumOrCourt;
  }
  if (secondaryRef) {
    activeOptionalKeys.push('secondary_reference');
    optionalFieldValues['secondary_reference'] = secondaryRef;
  }
  activeOptionalKeys.push('coram_presiding');
  optionalFieldValues['coram_presiding'] =
    detectedCategory === 'criminal'
      ? 'Court of Chief Metropolitan Magistrate (CMM), Tis Hazari'
      : detectedCategory === 'constitutional'
        ? 'Division Bench (Hon\'ble Chief Justice + Companion Judge)'
        : 'Commercial Court Single Judge / Bench';

  activeOptionalKeys.push('court_level');
  optionalFieldValues['court_level'] =
    detectedCategory === 'criminal'
      ? 'Magistrate Court (CMM / ACMM)'
      : detectedCategory === 'constitutional'
        ? 'High Court (Division Bench)'
        : detectedCategory === 'arbitration'
          ? 'Sole Arbitrator Tribunal'
          : 'District / Commercial Court';

  return {
    headline,
    caseCategory: detectedCategory,
    initiatingParty,
    opposingParty,
    sections: Array.from(matchedSectionCodes),
    forumOrCourt,
    claimOrDisputedValue: extractedValuation,
    secondaryReference: secondaryRef,
    disputeDescription: briefText.trim() || 'Dispute parsed from matter documentation.',
    policeJurisdiction,
    coramBench: optionalFieldValues['coram_presiding'],
    activeOptionalKeys,
    optionalFieldValues,
    confidenceScore: 0.94,
  };
}

// -----------------------------------------------------------------------------
// CASE 1: Orion Components v. Delta Systems
// -----------------------------------------------------------------------------
export const CASE_ORION_V_DELTA: MatterCase = {
  id: 'case_01',
  case_code: 'orion_v_delta',
  case_title: 'Orion Components v. Delta Systems',
  case_subtitle:
    'Commercial recovery matter · Delhi District Court · Internal preparation workspace',
  court_forum: 'Commercial Court, Patiala House Courts, New Delhi',
  claim_amount: '₹1,85,00,000 (Principal ₹1.50 Cr + 18% p.a. Interest)',
  dispute_description:
    'Recovery of unpaid structural steel invoices (₹1.85 Cr) with counter-allegations of latent defective fabrication raised by respondent after contractual 15-day inspection window.',
  matter_status: 'Initial assessment',
  evidence_completeness: 82,
  open_gaps_count: 4,
  last_reviewed: 'Today, 10:42',
  parties: [
    {
      id: 'party_1',
      name: 'Orion Components Pvt Ltd',
      role: 'Claimant / Creditor',
      entity_type: 'Private Limited Company',
      address: 'Plot 48, Okhla Industrial Area Phase III, New Delhi - 110020',
      contact_person: 'Mr. Arvind Malhotra (Director)',
      signatory: 'Authorized Signatory via Board Resolution dated 15 Jan 2024',
    },
    {
      id: 'party_2',
      name: 'Delta Systems & Infra LLP',
      role: 'Respondent / Debtor',
      entity_type: 'LLP',
      address: 'Tower B, Cyber Hub, DLF Phase 2, Gurugram, Haryana - 122002',
      contact_person: 'Mr. Vikramaditya Rathore (Designated Partner)',
      signatory: 'Designated Partner under LLP Agreement',
    },
    {
      id: 'party_3',
      name: 'Sanjay Rawat',
      role: 'Witness / Site Engineer',
      entity_type: 'Individual Partner',
      address: 'Delta Site Office, Sector 62, Gurugram',
      contact_person: 'Site In-charge who countersigned challans DC-1041 to 1046',
    },
  ],
  statutory_sections: [
    STATUTORY_RECKONER_DB.sec12a_cca,
    STATUTORY_RECKONER_DB.sec21_arb,
    STATUTORY_RECKONER_DB.sec318_bns,
    STATUTORY_RECKONER_DB.sec63_bsa,
  ],
  documents: [
    {
      id: 'doc_1',
      filename: 'Master_Supply_Agreement_2024.pdf',
      doc_type: 'Commercial Contract',
      pages: 36,
      date: '10 Feb 2024',
      file_size: '2.4 MB',
      status: 'Parsed',
      extracted_clauses: [
        {
          clause_number: 'Clause 7.2',
          clause_title: 'Payment Terms & Credit Window',
          extracted_snippet:
            'Buyer shall remit 100% invoice amount within thirty (30) calendar days from receipt of goods.',
          legal_impact: 'Establishes 30-day default date and triggers commercial interest clock.',
        },
        {
          clause_number: 'Clause 14.1',
          clause_title: 'Defect Notification Window',
          extracted_snippet:
            'Any quality objection must be lodged within 15 days of delivery; failure deems goods accepted unconditionally.',
          legal_impact: 'Fatal to Buyer late defect claim dispatched on Day 19.',
        },
        {
          clause_number: 'Clause 19.1',
          clause_title: 'Dispute Resolution (DIAC)',
          extracted_snippet:
            'Disputes shall be referred to Sole Arbitrator appointed under Delhi International Arbitration Centre (DIAC) Rules.',
          legal_impact:
            'Mandates Section 21 notice and DIAC institutional arbitration in New Delhi.',
        },
      ],
      raw_ocr_snippet:
        'MASTER SUPPLY AGREEMENT executed on 10th February 2024 between Orion Components Pvt Ltd and Delta Systems LLP...',
      associated_gaps: [
        'Missing Joint Inspection Report',
        'Defect Notice Window Exceeded',
        'Arbitration Uninvoked',
      ],
    },
    {
      id: 'doc_2',
      filename: 'Invoices_INV_1041_to_1046_and_Challans.pdf',
      doc_type: 'Tax Invoices & Challans',
      pages: 18,
      date: '14 Jan 2026',
      file_size: '3.8 MB',
      status: 'Parsed',
      extracted_clauses: [
        {
          clause_number: 'Tax Invoices',
          clause_title: 'GST E-Way Bills & Tax Invoices',
          extracted_snippet:
            'Invoices INV-1041 to INV-1046 totaling ₹1,85,00,000 with corresponding GST E-Way bills 491028491028.',
          legal_impact: 'Unassailable proof of supply for Order 37 summary debt recovery.',
        },
      ],
      raw_ocr_snippet:
        'DELIVERY CHALLAN DC-1044 dated 14/01/2026. Goods received in good condition. Stamped by Site Engineer Sanjay Rawat.',
      associated_gaps: ['Missing Joint Inspection Report'],
    },
    {
      id: 'doc_3',
      filename: 'Statutory_Demand_Notice_SpeedPost_POD.pdf',
      doc_type: 'Legal Notice & Tracking',
      pages: 6,
      date: '18 Feb 2026',
      file_size: '1.1 MB',
      status: 'Parsed',
      extracted_clauses: [
        {
          clause_number: 'Demand Notice',
          clause_title: '15-Day Cure Notice for ₹1.50 Cr',
          extracted_snippet:
            'Demand notice dispatched via Speed Post ED984128912IN giving 15 days to remit ₹1.50 Cr.',
          legal_impact:
            'Crystallizes cause of action upon expiry of 15-day cure window on 08 March 2026.',
        },
      ],
      raw_ocr_snippet:
        'INDIA POST TRACKING: Consignment ED984128912IN delivered to Delta Systems Cyber Hub on 21/02/2026.',
      associated_gaps: ['Section 12A Pre-Institution Mediation Mandate'],
    },
  ],
  timeline: [
    {
      id: 'tl_1',
      date: '10 Feb 2024',
      title: 'Master Supply Agreement Executed',
      description:
        'Parties agree to 30-day payment terms, 15-day defect notice clause, and DIAC arbitration.',
      source: {
        title: 'Master Supply Agreement',
        doc_name: 'Master_Supply_Agreement_2024.pdf',
        page_or_clause: 'Clause 7.2 & 19.1',
      },
    },
    {
      id: 'tl_2',
      date: '14 Jan 2026',
      title: 'Consignment Delivered at Site',
      description:
        'Orion delivered 600 MT structural steel; delivery challans DC-1041 to 1046 countersigned by site engineer.',
      source: {
        title: 'Challan DC-1044',
        doc_name: 'Invoices_INV_1041_to_1046_and_Challans.pdf',
        page_or_clause: 'Page 8',
      },
    },
    {
      id: 'tl_3',
      date: '02 Feb 2026',
      title: 'Delta Dispatches Defect Objection (Day 19)',
      description:
        'Delta raises debit notes citing quality issues 19 days after delivery (exceeding contractual 15-day window).',
      source: {
        title: 'Email Correspondence',
        doc_name: 'Invoices_INV_1041_to_1046_and_Challans.pdf',
        page_or_clause: 'Debit Note DN-44',
      },
    },
    {
      id: 'tl_4',
      date: '18 Feb 2026',
      title: 'Orion Serves Statutory Demand Notice',
      description:
        'Demand notice served for ₹1.50 Cr principal balance; India Post delivery confirmed on 21 Feb 2026.',
      source: {
        title: 'Demand Notice',
        doc_name: 'Statutory_Demand_Notice_SpeedPost_POD.pdf',
        page_or_clause: 'Consignment #ED984128912IN',
      },
    },
  ],
  facts: [
    {
      id: 'fact_1',
      label: 'Claimant (Supplier)',
      value: 'Orion Components Pvt Ltd, Okhla Phase III, New Delhi',
      category: 'Parties',
      source: {
        title: 'Master Supply Agreement',
        doc_name: 'Master_Supply_Agreement_2024.pdf',
        page_or_clause: 'Page 2',
      },
      verified: true,
    },
    {
      id: 'fact_2',
      label: 'Respondent (Buyer)',
      value: 'Delta Systems & Infra LLP, Cyber Hub, Gurugram, Haryana',
      category: 'Parties',
      source: {
        title: 'Master Supply Agreement',
        doc_name: 'Master_Supply_Agreement_2024.pdf',
        page_or_clause: 'Page 2',
      },
      verified: true,
    },
    {
      id: 'fact_3',
      label: 'Outstanding Principal Debt',
      value: '₹1,50,00,000 (after adjusting ₹35 Lakhs partial payment)',
      category: 'Financial',
      source: {
        title: 'Invoices Summary & Bank Ledger',
        doc_name: 'Invoices_INV_1041_to_1046_and_Challans.pdf',
        page_or_clause: 'Summary Ledger p. 1',
      },
      verified: true,
    },
    {
      id: 'fact_4',
      label: 'Defect Notification Window',
      value: '15 calendar days from delivery; failure deems goods accepted unconditionally',
      category: 'Contractual',
      source: {
        title: 'Inspection Clause',
        doc_name: 'Master_Supply_Agreement_2024.pdf',
        page_or_clause: 'Clause 14.1 (p. 18)',
      },
      verified: true,
    },
  ],
  gaps: [
    {
      id: 'gap_1',
      title: 'Missing Joint Laboratory Inspection Report',
      category: 'Documentary',
      severity: 'High',
      status: 'Open',
      plain_english_explanation:
        'Delta raised defect objections but failed to produce a joint laboratory test report from an accredited NABL facility as required under Clause 14.2.',
      statutory_or_clause_ref: 'Clause 14.2 of Master Supply Agreement',
      source: {
        title: 'Master Supply Agreement',
        doc_name: 'Master_Supply_Agreement_2024.pdf',
        page_or_clause: 'Clause 14.2',
      },
      suggested_fix:
        'Serve formal letter demanding production of NABL certified test report or joint inspection logs.',
      remedial_cta_label: 'Upload Joint Inspection Report',
      remedial_cta_action_type: 'upload_doc',
    },
    {
      id: 'gap_2',
      title: 'Defect Notice Served Beyond Contractual 15-Day Window',
      category: 'Procedural / Notice',
      severity: 'High',
      status: 'Open',
      plain_english_explanation:
        'Consignment delivered on 14 Jan 2026. Delta sent quality objection on 02 Feb 2026 (Day 19). Under Clause 14.1, goods are deemed accepted on Day 15.',
      statutory_or_clause_ref:
        'Clause 14.1 MSA & Section 42 Sale of Goods Act (r/w Sec 318 BNS / Sec 420 IPC)',
      source: {
        title: 'Delivery Challan vs Email Date',
        doc_name: 'Invoices_INV_1041_to_1046_and_Challans.pdf',
        page_or_clause: 'Challan Date 14 Jan',
      },
      suggested_fix:
        'Issue rebuttal notice asserting waiver of defect objection under Clause 14.1.',
      remedial_cta_label: 'Draft Rebuttal & Waiver Notice',
      remedial_cta_action_type: 'draft_notice',
      remedial_target_template: 'draft_sec21_arbitration',
    },
    {
      id: 'gap_3',
      title: 'Arbitration Clause (DIAC) Present But Uninvoked',
      category: 'Contractual / Clause',
      severity: 'Medium',
      status: 'Open',
      plain_english_explanation:
        'Clause 19.1 mandates Delhi International Arbitration Centre (DIAC) arbitration. Supplier has not yet issued formal Section 21 notice under Arbitration Act (r/w Sec 528 BNSS / 482 CrPC).',
      statutory_or_clause_ref: 'Section 21, Arbitration & Conciliation Act 1996 & Clause 19.1 MSA',
      source: {
        title: 'Dispute Clause',
        doc_name: 'Master_Supply_Agreement_2024.pdf',
        page_or_clause: 'Clause 19.1',
      },
      suggested_fix:
        'Issue notice proposing 3 retired High Court judges as Sole Arbitrator under DIAC rules.',
      remedial_cta_label: 'Generate Section 21 DIAC Notice',
      remedial_cta_action_type: 'draft_notice',
      remedial_target_template: 'draft_sec21_arbitration',
    },
    {
      id: 'gap_4',
      title: 'Section 12A Pre-Institution Mediation Mandate',
      category: 'Limitation / Timeline',
      severity: 'Medium',
      status: 'Open',
      plain_english_explanation:
        'Supreme Court in Patil Automation (2022) mandates Section 12A mediation prior to commercial court suit unless urgent interim relief is prayed for.',
      statutory_or_clause_ref: 'Section 12A, Commercial Courts Act 2015',
      source: {
        title: 'Commercial Courts Act',
        doc_name: 'Commercial Courts Act 2015',
        page_or_clause: 'Section 12A',
      },
      suggested_fix:
        'File Form 1 before DSLSA or apply for Section 9 High Court interim asset freeze.',
      remedial_cta_label: 'Generate Section 12A Form 1',
      remedial_cta_action_type: 'draft_notice',
      remedial_target_template: 'draft_sec12a_form1',
    },
  ],
  actions: [
    {
      id: 'act_1',
      title: 'Issue Rebuttal & Section 21 Notice of Invocation of Arbitration (DIAC)',
      category: 'Pre-Litigation',
      short_description:
        'Reject unilateral debit notes citing Clause 14.1 defect notice expiry and invoke DIAC arbitration.',
      prerequisites: ['Certified interest ledger', 'Speed post proof of delivery'],
      statutory_ref: 'Section 21, Arbitration & Conciliation Act 1996 & Clause 19.1 MSA',
      next_procedural_steps: [
        'Issue notice nominating 3 independent retired judges as Sole Arbitrator.',
      ],
      feasibility_score: 88,
      recommended_tag: 'Recommended Primary Route',
      draft_template_id: 'draft_sec21_arbitration',
    },
    {
      id: 'act_2',
      title: 'Seek Section 9 Interim Asset Freeze / Bank Deposit in High Court',
      category: 'Interim Relief',
      short_description:
        'Seek interim order directing Delta to deposit ₹1.50 Cr in fixed deposit pending arbitration.',
      prerequisites: ['Proof of Delta asset transfer or liquidation risk'],
      statutory_ref: 'Section 9, Arbitration & Conciliation Act 1996',
      next_procedural_steps: [
        'Draft Section 9 Petition before Commercial Division of Delhi High Court.',
      ],
      feasibility_score: 84,
      draft_template_id: 'draft_sec9_hc',
    },
    {
      id: 'act_3',
      title: 'Initiate Section 12A Pre-Institution Mediation (DSLSA / SAMADHAN)',
      category: 'Settlement & ADR',
      short_description:
        'File Form 1 before Delhi State Legal Services Authority for rapid settlement.',
      prerequisites: ['Payment of nominal ₹1,000 fee', 'Form 1 schedule'],
      statutory_ref: 'Section 12A, Commercial Courts Act 2015',
      next_procedural_steps: ['Submit Form 1 before Commercial Court Mediation Centre.'],
      feasibility_score: 76,
      draft_template_id: 'draft_sec12a_form1',
    },
    {
      id: 'act_4',
      title: 'Obtain Section 63 BSA 2023 Electronic Certificate for Email Trail',
      category: 'Evidence Preservation',
      short_description: 'Preserve electronic audit logs and hash certificates for email trails.',
      prerequisites: ['Forensic export of original RFC 822 headers'],
      statutory_ref: 'Section 63, Bharatiya Sakshya Adhiniyam 2023',
      next_procedural_steps: ['Sign Section 63 BSA certificate with IT head.'],
      feasibility_score: 95,
      recommended_tag: 'Immediate First Step',
      draft_template_id: 'draft_bsa_cert',
    },
  ],
  precedents: [
    {
      id: 'prec_1',
      case_title: 'Patil Automation Pvt Ltd vs. Rakheja Engineers Private Ltd',
      citation: '(2022) 10 SCC 1',
      court: 'Supreme Court of India',
      coram: 'Hon’ble K.M. Joseph & Hrishikesh Roy, JJ.',
      decision_date: '17 Aug 2022',
      status_badge: 'Good Law (Landmark)',
      outcome_tag: 'Mandatory Mediation Upheld',
      similarity_score: 94,
      matched_sections: ['Section 12A, Commercial Courts Act 2015'],
      ratio_decidendi:
        'Section 12A of the Commercial Courts Act, 2015 is mandatory. Any commercial suit instituted without exhausting Pre-Institution Mediation, in the absence of urgent interim relief, is liable to be rejected at the threshold under Order VII Rule 11 CPC.',
      facts_summary:
        'Commercial recovery suit filed without prior mediation. Supreme Court declared Section 12A mandatory from date of judgment.',
      petitioner_arguments: ['Word "shall" in Section 12A creates absolute statutory obligation.'],
      respondent_arguments: ['Section 12A is directory; non-compliance is curable.'],
      judge_findings:
        'Commercial court decongestion requires strict enforcement of mediation mandate.',
    },
  ],
  sample_enrichment_text:
    'Delta Managing Director sent WhatsApp message on 24 Feb 2026: "We have reviewed records; ₹1.45 Cr is confirmed payable. We face temporary liquidity crunch. Please hold notice for 30 days and we will clear ₹50L next week and balance by March 31."',
  sample_enrichment_doc_name: 'WhatsApp_Chat_Export_MD_Admission.pdf',
};

// -----------------------------------------------------------------------------
// CASE 2: CloudNet v. Starlight Analytics
// -----------------------------------------------------------------------------
export const CASE_CLOUDNET_V_STARLIGHT: MatterCase = {
  id: 'case_02',
  case_code: 'cloudnet_v_starlight',
  case_title: 'CloudNet Tech v. Starlight Analytics',
  case_subtitle:
    'Service SLA termination dispute · Bengaluru Commercial Court · Internal preparation',
  court_forum: 'Commercial Court, Bengaluru City Civil Court',
  claim_amount: '₹65,00,000 (Final Invoices + Wrongful Termination Notice Pay)',
  dispute_description:
    'Wrongful unilateral termination of multi-year enterprise SaaS agreement, disputed milestone acceptance, and non-payment of final transition deliverables and lock-in period fees.',
  matter_status: 'Active assessment',
  evidence_completeness: 74,
  open_gaps_count: 2,
  last_reviewed: 'Yesterday, 16:15',
  parties: [
    {
      id: 'p_b1',
      name: 'CloudNet Tech Solutions India Pvt Ltd',
      role: 'Claimant / Creditor',
      entity_type: 'Private Limited Company',
      address: 'ITPL Main Road, Whitefield, Bengaluru - 560066',
      contact_person: 'Ms. Priya Sundaram (Legal Head)',
    },
    {
      id: 'p_b2',
      name: 'Starlight Analytics Corp',
      role: 'Respondent / Debtor',
      entity_type: 'Private Limited Company',
      address: 'Building 10, DLF Cyber City, Gurugram - 122002',
      contact_person: 'Mr. David Miller (VP Operations)',
    },
  ],
  statutory_sections: [STATUTORY_RECKONER_DB.sec12a_cca, STATUTORY_RECKONER_DB.sec63_bsa],
  documents: [
    {
      id: 'doc_b1',
      filename: 'Master_Services_Agreement_IT_2023.pdf',
      doc_type: 'Service Contract',
      pages: 44,
      date: '15 Mar 2023',
      file_size: '2.8 MB',
      status: 'Parsed',
      extracted_clauses: [
        {
          clause_number: 'Clause 11.3',
          clause_title: 'Termination for Cause & 30-Day Cure',
          extracted_snippet:
            'Either party may terminate for material breach only after serving thirty (30) days written notice to cure.',
          legal_impact: 'Immediate termination without cure notice constitutes repudiatory breach.',
        },
      ],
      raw_ocr_snippet: 'MASTER SERVICES AGREEMENT for Managed Cloud & Network Infrastructure...',
      associated_gaps: ['Wrongful Termination Without Mandatory 30-Day Cure Window'],
    },
    {
      id: 'doc_b2',
      filename: 'Termination_Letter_Immediate_Effect.pdf',
      doc_type: 'Termination Notice',
      pages: 3,
      date: '05 Jan 2026',
      file_size: '420 KB',
      status: 'Parsed',
      extracted_clauses: [
        {
          clause_number: 'Termination Paragraph 2',
          clause_title: 'Immediate Termination Notice',
          extracted_snippet:
            'Notice is hereby given terminating services with immediate effect due to 98.2% uptime in Dec 2025.',
          legal_impact: 'Direct documentary admission of bypassing 30-day cure window.',
        },
      ],
      raw_ocr_snippet: 'LETTER OF TERMINATION: Effective immediately as of January 5, 2026...',
      associated_gaps: ['Wrongful Termination Without Mandatory 30-Day Cure Window'],
    },
    {
      id: 'doc_b3',
      filename: 'Reply_to_Termination_and_SLA_Logs.pdf',
      doc_type: 'Uptime Logs & Rebuttal',
      pages: 14,
      date: '16 Jan 2026',
      file_size: '2.1 MB',
      status: 'Parsed',
      extracted_clauses: [
        {
          clause_number: 'Annexure B',
          clause_title: 'Scheduled Maintenance Exclusion',
          extracted_snippet:
            'Uptime was 99.4% when scheduled power maintenance by Starlight is excluded.',
          legal_impact: 'Disproves alleged SLA breach.',
        },
      ],
      raw_ocr_snippet: 'CLOUDNET TELEMETRY REPORT: Total scheduled downtime: 4.5 hours...',
      associated_gaps: ['Unsigned Monthly SLA Log for December 2025'],
    },
  ],
  timeline: [
    {
      id: 'tl_b1',
      date: '15 Mar 2023',
      title: 'Master Services Agreement Executed',
      description: '3-year managed IT contract with 30-day cure notice under Clause 11.3.',
      source: {
        title: 'Master Services Agreement',
        doc_name: 'Master_Services_Agreement_IT_2023.pdf',
        page_or_clause: 'Clause 11.3',
      },
    },
    {
      id: 'tl_b2',
      date: '05 Jan 2026',
      title: 'Starlight Terminates with Immediate Effect',
      description:
        'Starlight terminates contract citing 98.2% server uptime without giving 30-day cure window.',
      source: {
        title: 'Termination Letter',
        doc_name: 'Termination_Letter_Immediate_Effect.pdf',
        page_or_clause: 'Paragraph 2',
      },
    },
  ],
  facts: [
    {
      id: 'fact_b1',
      label: 'Service Provider',
      value: 'CloudNet Tech Solutions India Pvt Ltd, Bengaluru',
      category: 'Parties',
      source: {
        title: 'MSA Header',
        doc_name: 'Master_Services_Agreement_IT_2023.pdf',
        page_or_clause: 'Page 1',
      },
      verified: true,
    },
    {
      id: 'fact_b2',
      label: 'Client Company',
      value: 'Starlight Analytics Corp, Gurugram',
      category: 'Parties',
      source: {
        title: 'MSA Header',
        doc_name: 'Master_Services_Agreement_IT_2023.pdf',
        page_or_clause: 'Page 1',
      },
      verified: true,
    },
    {
      id: 'fact_b3',
      label: 'Outstanding Invoices Claimed',
      value: '₹65,00,000 for Oct-Dec 2025 services rendered',
      category: 'Financial',
      source: {
        title: 'Invoices Ledger',
        doc_name: 'Reply_to_Termination_and_SLA_Logs.pdf',
        page_or_clause: 'Page 4',
      },
      verified: true,
    },
  ],
  gaps: [
    {
      id: 'gap_b1',
      title: 'Wrongful Termination Without Mandatory 30-Day Cure Window',
      category: 'Procedural / Notice',
      severity: 'High',
      status: 'Open',
      plain_english_explanation:
        'Starlight bypassed 30-day cure notice required under Clause 11.3. This constitutes repudiatory breach.',
      statutory_or_clause_ref: 'Clause 11.3 MSA & Section 73 Contract Act',
      source: {
        title: 'Termination Letter',
        doc_name: 'Termination_Letter_Immediate_Effect.pdf',
        page_or_clause: 'Paragraph 2',
      },
      suggested_fix: 'Issue formal legal notice claiming wrongful termination damages.',
      remedial_cta_label: 'Draft Repudiation & Damages Notice',
      remedial_cta_action_type: 'draft_notice',
      remedial_target_template: 'draft_wrongful_termination',
    },
    {
      id: 'gap_b2',
      title: 'Unsigned Monthly SLA Log for December 2025',
      category: 'Documentary',
      severity: 'Medium',
      status: 'Open',
      plain_english_explanation:
        'Oct and Nov logs were signed, but Dec 2025 SLA report was unacknowledged by client.',
      statutory_or_clause_ref: 'Clause 6.2 MSA (Monthly Reporting)',
      source: {
        title: 'Uptime Logs',
        doc_name: 'Reply_to_Termination_and_SLA_Logs.pdf',
        page_or_clause: 'Exhibit B',
      },
      suggested_fix: 'Export automated server telemetry signed under Section 63 BSA.',
      remedial_cta_label: 'Upload Server Log Telemetry',
      remedial_cta_action_type: 'upload_doc',
    },
  ],
  actions: [
    {
      id: 'act_b1',
      title: 'Issue Legal Notice for Wrongful Termination & ₹65L Dues',
      category: 'Pre-Litigation',
      short_description: 'Demand payment of earned invoices + 3 months notice pay.',
      prerequisites: ['Certified server logs'],
      statutory_ref: 'Section 73, Indian Contract Act 1872',
      next_procedural_steps: ['Dispatch notice with 15-day window.'],
      feasibility_score: 90,
      recommended_tag: 'Recommended Action',
      draft_template_id: 'draft_wrongful_termination',
    },
  ],
  precedents: [
    {
      id: 'prec_b1',
      case_title: 'Kailash Nath Associates vs. DDA',
      citation: '(2015) 4 SCC 136',
      court: 'Supreme Court of India',
      coram: 'Hon’ble Ranjan Gogoi & R.F. Nariman, JJ.',
      decision_date: '09 Jan 2015',
      status_badge: 'Good Law (Landmark)',
      outcome_tag: 'Proof of Loss Mandatory',
      similarity_score: 89,
      matched_sections: ['Section 73 & 74, Contract Act'],
      ratio_decidendi:
        'Proof of actual loss is a sine qua non for claiming damages. Termination without established loss does not forfeit earned dues.',
      facts_summary:
        'DDA forfeited earnest money without establishing damages. Supreme Court held forfeiture illegal.',
      petitioner_arguments: ['Forfeiture without proving loss violates Section 74.'],
      respondent_arguments: ['Contract provided unconditional right to forfeit.'],
      judge_findings: 'Proof of actual loss must be established.',
    },
  ],
  sample_enrichment_text:
    'Starlight IT Director emailed: "Uptime was 99.4% when scheduled maintenance is excluded. We terminated due to corporate restructuring, not technical failure."',
  sample_enrichment_doc_name: 'Starlight_Admission_Restructuring.pdf',
};

// -----------------------------------------------------------------------------
// CASE 3: Precision Flow v. Vanguard Infra
// -----------------------------------------------------------------------------
export const CASE_PRECISION_V_VANGUARD: MatterCase = {
  id: 'case_03',
  case_code: 'precision_v_vanguard',
  case_title: 'Precision Flow v. Vanguard Infra',
  case_subtitle: 'Summary debt recovery · Delhi Commercial Court · Ready for filing',
  court_forum: 'Commercial Court, Saket Courts, New Delhi',
  claim_amount: '₹42,00,000 (Admitted Trade Debt)',
  dispute_description:
    'Default on admitted trade debt arising from industrial pumps consignment supply, supported by signed delivery challans and formal written balance confirmation letter from debtor CFO.',
  matter_status: 'Ready for action',
  evidence_completeness: 94,
  open_gaps_count: 1,
  last_reviewed: '25 Feb, 14:00',
  parties: [
    {
      id: 'p_c1',
      name: 'Precision Flow Pumps Pvt Ltd',
      role: 'Claimant / Creditor',
      entity_type: 'Private Limited Company',
      address: 'Naraina Industrial Area, New Delhi - 110028',
      contact_person: 'Mr. Rajesh Mehra (Managing Director)',
    },
    {
      id: 'p_c2',
      name: 'Vanguard Engineering & Infra Ltd',
      role: 'Respondent / Debtor',
      entity_type: 'Private Limited Company',
      address: 'Sector 62, Institutional Area, Noida - 201309',
      contact_person: 'Mr. Alok Verma (CFO)',
    },
  ],
  statutory_sections: [STATUTORY_RECKONER_DB.sec12a_cca, STATUTORY_RECKONER_DB.sec318_bns],
  documents: [
    {
      id: 'doc_c1',
      filename: 'Purchase_Orders_and_Invoices.pdf',
      doc_type: 'PO & Tax Invoices',
      pages: 12,
      date: '25 Sep 2025',
      file_size: '2.5 MB',
      status: 'Parsed',
      extracted_clauses: [
        {
          clause_number: 'PO #890',
          clause_title: 'Industrial Pumps Delivery',
          extracted_snippet: 'Supply of 12 heavy-duty submersible pumps for ₹42,00,000.',
          legal_impact: 'Confirmed purchase order under Sale of Goods Act.',
        },
      ],
      raw_ocr_snippet: 'PURCHASE ORDER NO. PO-890. Delivery accepted by Vanguard Warehouse...',
      associated_gaps: ['Section 12A Commercial Courts Pre-Institution Mediation Required'],
    },
    {
      id: 'doc_c2',
      filename: 'Debtor_Balance_Confirmation_Letter.pdf',
      doc_type: 'Balance Confirmation',
      pages: 2,
      date: '10 Nov 2025',
      file_size: '410 KB',
      status: 'Parsed',
      extracted_clauses: [
        {
          clause_number: 'Balance Letter',
          clause_title: 'Unconditional Acknowledgment',
          extracted_snippet:
            'We hereby confirm that the balance of ₹42,00,000 is due and payable in our books.',
          legal_impact: 'Written acknowledgment under Section 18 Limitation Act and Order 37 CPC.',
        },
      ],
      raw_ocr_snippet:
        'AUDITOR CONFIRMATION: Vanguard Engineering acknowledges balance of ₹42,00,000/-',
      associated_gaps: ['Section 12A Commercial Courts Pre-Institution Mediation Required'],
    },
  ],
  timeline: [
    {
      id: 'tl_c1',
      date: '25 Sep 2025',
      title: 'Pumps Delivered & Challans Signed',
      description: 'Goods delivered with countersigned delivery challans.',
      source: {
        title: 'Delivery Challan #DC-442',
        doc_name: 'Purchase_Orders_and_Invoices.pdf',
        page_or_clause: 'Page 3',
      },
    },
    {
      id: 'tl_c2',
      date: '10 Nov 2025',
      title: 'Vanguard Issues Stamped Balance Confirmation',
      description: 'Vanguard formally acknowledges ₹42,00,000 due.',
      source: {
        title: 'Balance Confirmation',
        doc_name: 'Debtor_Balance_Confirmation_Letter.pdf',
        page_or_clause: 'Page 1',
      },
    },
  ],
  facts: [
    {
      id: 'fact_c1',
      label: 'Creditor',
      value: 'Precision Flow Pumps Pvt Ltd, New Delhi',
      category: 'Parties',
      source: {
        title: 'Invoice Header',
        doc_name: 'Purchase_Orders_and_Invoices.pdf',
        page_or_clause: 'Page 1',
      },
      verified: true,
    },
    {
      id: 'fact_c2',
      label: 'Debtor',
      value: 'Vanguard Engineering & Infra Ltd, Noida',
      category: 'Parties',
      source: {
        title: 'PO Header',
        doc_name: 'Purchase_Orders_and_Invoices.pdf',
        page_or_clause: 'Page 1',
      },
      verified: true,
    },
    {
      id: 'fact_c3',
      label: 'Admitted Debt',
      value: '₹42,00,000 confirmed in writing',
      category: 'Financial',
      source: {
        title: 'Balance Confirmation',
        doc_name: 'Debtor_Balance_Confirmation_Letter.pdf',
        page_or_clause: 'Page 1',
      },
      verified: true,
    },
  ],
  gaps: [
    {
      id: 'gap_c1',
      title: 'Section 12A Commercial Courts Pre-Institution Mediation Required',
      category: 'Procedural / Notice',
      severity: 'Medium',
      status: 'Open',
      plain_english_explanation:
        'Prior to filing Order 37 summary suit, Section 12A mediation must be initiated per Patil Automation.',
      statutory_or_clause_ref: 'Section 12A Commercial Courts Act 2015',
      source: {
        title: 'Statute',
        doc_name: 'Commercial Courts Act 2015',
        page_or_clause: 'Section 12A',
      },
      suggested_fix: 'File Form 1 before DSLSA for quick 30-day mediation.',
      remedial_cta_label: 'Generate Section 12A Form 1',
      remedial_cta_action_type: 'draft_notice',
      remedial_target_template: 'draft_sec12a_form1',
    },
  ],
  actions: [
    {
      id: 'act_c1',
      title: 'File Summary Suit under Order XXXVII CPC in Commercial Court',
      category: 'Formal Proceedings',
      short_description: 'File summary recovery plaint based on balance confirmation.',
      prerequisites: ['Section 12A non-starter report', 'Ad-valorem court fee'],
      statutory_ref: 'Order XXXVII Rule 1 & 2 CPC',
      next_procedural_steps: ['File Plaint with Statement of Truth.'],
      feasibility_score: 94,
      recommended_tag: 'Recommended Action',
      draft_template_id: 'draft_order37_cpc',
    },
  ],
  precedents: [
    {
      id: 'prec_c1',
      case_title: 'IDBI Trusteeship vs. Hubtown Ltd',
      citation: '(2017) 1 SCC 568',
      court: 'Supreme Court of India',
      coram: 'Hon’ble J. Chelameswar & Abhay Manohar Sapre, JJ.',
      decision_date: '15 Nov 2016',
      status_badge: 'Good Law (Landmark)',
      outcome_tag: 'Summary Judgment Principles',
      similarity_score: 96,
      matched_sections: ['Order XXXVII Rule 3 CPC'],
      ratio_decidendi:
        'When written admissions exist on record, moonshine defenses do not entitle the defendant to unconditional leave to defend.',
      facts_summary:
        'Debtor admitted debt in writing. Supreme Court held summary decree justified.',
      petitioner_arguments: ['Written confirmation estops debtor.'],
      respondent_arguments: ['Defendant is entitled to full trial.'],
      judge_findings: 'Summary suits are designed for speedy disposal where admissions exist.',
    },
  ],
  sample_enrichment_text:
    'Vanguard sent email stating: "RTGS for ₹42,00,000 scheduled in 2 tranches on 15 March and 30 March."',
  sample_enrichment_doc_name: 'Vanguard_Payment_Schedule_Commitment.pdf',
};

export const CASE_SHIVAM_V_BANSAL: MatterCase = {
  id: 'case_04',
  case_code: 'shivam_v_bansal' as any,
  case_title: 'State (Shivam Polymers) v. Rajesh Bansal & Anr.',
  case_subtitle:
    'Commercial Cheating, Criminal Breach of Trust & Sec 138 NI Act · Tis Hazari Courts, Delhi',
  court_forum:
    'Court of Chief Metropolitan Magistrate (CMM), Central District, Tis Hazari Courts, Delhi',
  claim_amount: '₹92,00,000 (Dishonoured Cheques + Inducement)',
  dispute_description:
    'Commercial cheating and dishonour of multiple post-dated settlement cheques totaling ₹92 Lakhs, accompanied by fraudulent diversion of hypothecated inventory and false solvency declarations.',
  matter_status: 'Pre-Trial & Bail Stage',
  evidence_completeness: 78,
  open_gaps_count: 3,
  last_reviewed: 'Today, 14:20',
  parties: [
    {
      id: 'p_d1',
      name: 'Shivam Polymers Pvt Ltd (Through Director Vikram Sethi)',
      role: 'Claimant / Creditor',
      entity_type: 'Private Limited Company',
      address: 'Industrial Area, Phase 1, Naraina, New Delhi - 110028',
      contact_person: 'Mr. Vikram Sethi (Complainant Director)',
      signatory: 'Authorized via Board Resolution dated 10 Jan 2026',
    },
    {
      id: 'p_d2',
      name: 'Rajesh Bansal (Managing Director, Bansal Packaging LLP)',
      role: 'Respondent / Debtor',
      entity_type: 'LLP',
      address: 'B-44, Lawrence Road Industrial Area, Delhi - 110035',
      contact_person: 'Accused No. 1 (Managing Director / In-charge of Business)',
      signatory: 'Signatory to dishonoured post-dated cheques',
    },
    {
      id: 'p_d3',
      name: 'Sangeeta Bansal (Partner, Bansal Packaging LLP)',
      role: 'Guarantor / Director',
      entity_type: 'Individual Partner',
      address: 'B-44, Lawrence Road Industrial Area, Delhi - 110035',
      contact_person: 'Accused No. 2 (Authorized Co-Signatory under Sec 141 NI Act)',
    },
    {
      id: 'p_d4',
      name: 'SI Ramesh Kumar (Investigating Officer)',
      role: 'Witness / Site Engineer',
      entity_type: 'Individual Partner',
      address: 'PS Economic Offences Wing (EOW) / Central District',
      contact_person: 'Investigating Officer in FIR No. 142/2026',
    },
  ],
  statutory_sections: [
    STATUTORY_RECKONER_DB.sec318_bns,
    STATUTORY_RECKONER_DB.sec316_bns,
    STATUTORY_RECKONER_DB.sec138_ni_act,
    STATUTORY_RECKONER_DB.sec35_bnss,
    STATUTORY_RECKONER_DB.sec528_bnss,
    STATUTORY_RECKONER_DB.sec63_bsa,
  ],
  documents: [
    {
      id: 'doc_d1',
      filename: 'FIR_142_2026_EOW_Cheating_CBT.pdf',
      doc_type: 'Police First Information Report',
      pages: 8,
      date: '12 Jan 2026',
      file_size: '1.6 MB',
      status: 'Parsed',
      extracted_clauses: [
        {
          clause_number: 'FIR Allegations',
          clause_title: 'Sections 318(4), 316(2), 336(3) BNS (Sec 420, 406, 468 IPC)',
          extracted_snippet:
            'Accused dishonestly induced complainant to supply 80 MT Polymer Granules on assurance of timely clearance and issued post-dated cheques from an account known to be dormant/closed.',
          legal_impact: 'Discloses cognizable cheating and dishonest inducement at inception.',
        },
      ],
      raw_ocr_snippet:
        'PS EOW CENTRAL: FIR No. 142/2026 registered under Section 318(4), 316(2) BNS against Rajesh Bansal...',
      associated_gaps: [
        'Section 35(3) BNSS Police Notice Non-Compliance',
        'Quashing Petition Filed under Sec 528 BNSS',
      ],
    },
    {
      id: 'doc_d2',
      filename: 'Dishonoured_Cheques_Bank_Memos.pdf',
      doc_type: 'Negotiable Instruments Record',
      pages: 6,
      date: '04 Jan 2026',
      file_size: '1.2 MB',
      status: 'Parsed',
      extracted_clauses: [
        {
          clause_number: 'Return Memos',
          clause_title: 'Cheque Nos. 004811-004814 (Total ₹92,00,000)',
          extracted_snippet:
            'HDFC Bank return memo dated 04 Jan 2026: Reason for return: "Account Closed / Funds Insufficient".',
          legal_impact:
            'Statutory basis for Section 138 NI Act and corroborative proof of fraudulent intent at inception.',
        },
      ],
      raw_ocr_snippet:
        'HDFC BANK RETURN MEMO: Cheque 004811 for ₹23,00,000 returned unpaid with remark: ACCOUNT CLOSED.',
      associated_gaps: ['Strict 30-Day Limitation for Section 138 NI Complaint'],
    },
    {
      id: 'doc_d3',
      filename: 'Statutory_Notice_138_NI_Act_POD.pdf',
      doc_type: 'Legal Demand Notice & Speed Post POD',
      pages: 5,
      date: '15 Jan 2026',
      file_size: '950 KB',
      status: 'Parsed',
      extracted_clauses: [
        {
          clause_number: 'Section 138(b) Notice',
          clause_title: '15-Day Demand Notice Served',
          extracted_snippet:
            'Notice delivered on 18 Jan 2026 per India Post Consignment #ED771928110IN. 15 days expired on 02 Feb 2026.',
          legal_impact:
            'Cause of action for filing NI Act 138 complaint crystallized on 03 Feb 2026.',
        },
      ],
      raw_ocr_snippet:
        'INDIA POST TRACKING: Consignment delivered to Lawrence Road address on 18/01/2026.',
      associated_gaps: ['Strict 30-Day Limitation for Section 138 NI Complaint'],
    },
  ],
  timeline: [
    {
      id: 'tl_d1',
      date: '02 Nov 2025',
      title: 'Commercial Representation & Order Booking',
      description:
        'Rajesh Bansal represented Bansal Packaging has ₹50 Cr annual turnover and induced supply of polymer granules.',
      source: {
        title: 'Email & WhatsApp Trail',
        doc_name: 'FIR_142_2026_EOW_Cheating_CBT.pdf',
        page_or_clause: 'Page 3',
      },
    },
    {
      id: 'tl_d2',
      date: '15 Nov 2025',
      title: 'Consignments Delivered & 4 Post-Dated Cheques Handed Over',
      description:
        'Goods worth ₹92 Lakhs delivered; Accused handed over 4 cheques drawn on HDFC Bank Lawrence Road.',
      source: {
        title: 'Tax Invoices & Challans',
        doc_name: 'FIR_142_2026_EOW_Cheating_CBT.pdf',
        page_or_clause: 'Annexure C',
      },
    },
    {
      id: 'tl_d3',
      date: '04 Jan 2026',
      title: 'Cheques Bounced with "Account Closed"',
      description:
        'Cheques presented upon due dates returned dishonoured with bank remark "Account Closed on 10 Oct 2025".',
      source: {
        title: 'Bank Return Memo',
        doc_name: 'Dishonoured_Cheques_Bank_Memos.pdf',
        page_or_clause: 'Memo #4811',
      },
    },
    {
      id: 'tl_d4',
      date: '12 Jan 2026',
      title: 'EOW Registers FIR & Dispatches Section 35(3) BNSS Notice',
      description:
        'FIR No. 142/2026 registered. IO issued Section 35(3) BNSS notice to Rajesh Bansal to join probe.',
      source: {
        title: 'Police FIR',
        doc_name: 'FIR_142_2026_EOW_Cheating_CBT.pdf',
        page_or_clause: 'Page 1',
      },
    },
  ],
  facts: [
    {
      id: 'fact_d1',
      label: 'Accused Fraudulent Representation',
      value:
        'Induced goods delivery by issuing post-dated cheques from account already closed prior to transaction date',
      category: 'Procedural',
      source: {
        title: 'Bank Return Memo',
        doc_name: 'Dishonoured_Cheques_Bank_Memos.pdf',
        page_or_clause: 'Account Closure Record',
      },
      verified: true,
    },
    {
      id: 'fact_d2',
      label: 'Dishonoured Cheque Value',
      value: '₹92,00,000 (4 cheques of ₹23,00,000 each)',
      category: 'Financial',
      source: {
        title: 'Cheques Summary',
        doc_name: 'Dishonoured_Cheques_Bank_Memos.pdf',
        page_or_clause: 'Page 2',
      },
      verified: true,
    },
    {
      id: 'fact_d3',
      label: 'Vicarious Liability of Partners',
      value:
        'Sangeeta Bansal is designated partner with joint banking authority under Section 141 NI Act',
      category: 'Parties',
      source: {
        title: 'MCA LLP Master Data',
        doc_name: 'FIR_142_2026_EOW_Cheating_CBT.pdf',
        page_or_clause: 'Page 5',
      },
      verified: true,
    },
  ],
  gaps: [
    {
      id: 'gap_d1',
      title: 'Accused Evading Section 35(3) BNSS Notice (formerly 41A CrPC)',
      category: 'Procedural / Notice',
      severity: 'High',
      status: 'Open',
      plain_english_explanation:
        'Accused Rajesh Bansal failed to appear before IO despite two notices under Section 35(3) BNSS. Complainant must file application before CMM for issuance of Non-Bailable Warrants (NBW).',
      statutory_or_clause_ref: 'Section 35(3) & 73 BNSS 2023 (formerly Sec 41A & 70 CrPC)',
      source: {
        title: 'Police Case Diary',
        doc_name: 'FIR_142_2026_EOW_Cheating_CBT.pdf',
        page_or_clause: 'Notice #35-B',
      },
      suggested_fix:
        'Move application before CMM seeking Non-Bailable Warrants and oppose Anticipatory Bail.',
      remedial_cta_label: 'Draft NBW & Bail Opposition Application',
      remedial_cta_action_type: 'draft_notice',
      remedial_target_template: 'draft_reply_quashing_528',
    },
    {
      id: 'gap_d2',
      title: 'Section 138 NI Act 30-Day Criminal Complaint Filing Window',
      category: 'Limitation / Timeline',
      severity: 'High',
      status: 'Open',
      plain_english_explanation:
        '15-day statutory notice cure period expired on 02 Feb 2026. Criminal complaint under Section 138/141 NI Act must be filed before Judicial Magistrate before 04 March 2026.',
      statutory_or_clause_ref: 'Section 138 & 142(1)(b), Negotiable Instruments Act 1881',
      source: {
        title: 'Speed Post POD',
        doc_name: 'Statutory_Notice_138_NI_Act_POD.pdf',
        page_or_clause: 'POD Delivery Date 18 Jan',
      },
      suggested_fix:
        'Draft and file formal Section 138 complaint with pre-summoning evidence affidavit.',
      remedial_cta_label: 'Generate Section 138 NI Criminal Complaint',
      remedial_cta_action_type: 'draft_notice',
      remedial_target_template: 'draft_sec138_ni_complaint',
    },
    {
      id: 'gap_d3',
      title: 'Section 63 BSA (formerly 65B) Hash Certificate for WhatsApp Inducement',
      category: 'Documentary',
      severity: 'Medium',
      status: 'Open',
      plain_english_explanation:
        'WhatsApp chat messages and audio voice notes showing accused promising immediate clearance require Section 63 BSA certificate to be admissible in trial.',
      statutory_or_clause_ref:
        'Section 63, Bharatiya Sakshya Adhiniyam 2023 & Arjun Khotkar (SC 2020)',
      source: {
        title: 'Electronic Chat Log',
        doc_name: 'FIR_142_2026_EOW_Cheating_CBT.pdf',
        page_or_clause: 'Annexure D',
      },
      suggested_fix: 'Execute Section 63 BSA certificate signed by IT system administrator.',
      remedial_cta_label: 'Upload Signed BSA Hash Certificate',
      remedial_cta_action_type: 'upload_doc',
    },
  ],
  actions: [
    {
      id: 'act_d1',
      title: 'File Criminal Complaint under Section 138 / 141 NI Act before Judicial Magistrate',
      category: 'Formal Proceedings',
      short_description:
        'Institute private criminal complaint against company and both directors with statutory presumption.',
      prerequisites: ['Original cheques & bank return memos', 'Speed Post tracking certificate'],
      statutory_ref: 'Section 138, 141, 142 NI Act 1881',
      next_procedural_steps: [
        'File complaint with pre-summoning evidence affidavit under Section 145 NI Act.',
      ],
      feasibility_score: 95,
      recommended_tag: 'Recommended Primary Criminal Route',
      draft_template_id: 'draft_sec138_ni_complaint',
    },
    {
      id: 'act_d2',
      title: 'Oppose Anticipatory Bail / Seek Custodial Interrogation under Section 482 BNSS',
      category: 'Formal Proceedings',
      short_description:
        'Oppose accused bail application by showing pre-planned fraud and closed bank accounts.',
      prerequisites: ['Bank account closure statement from HDFC Bank'],
      statutory_ref: 'Section 482 BNSS 2023 (formerly Section 438 CrPC)',
      next_procedural_steps: ['File detailed Reply / Status Report before Sessions Court.'],
      feasibility_score: 88,
      recommended_tag: 'Urgent Action',
      draft_template_id: 'draft_reply_quashing_528',
    },
    {
      id: 'act_d3',
      title: 'Obtain Section 63 BSA 2023 Electronic Evidence Certificate',
      category: 'Evidence Preservation',
      short_description:
        'Preserve WhatsApp chat exports and bank server SMS alerts with cryptographic hash.',
      prerequisites: ['Exported chat transcript with phone IMEI details'],
      statutory_ref: 'Section 63, Bharatiya Sakshya Adhiniyam 2023',
      next_procedural_steps: ['Sign Section 63 BSA certificate with Director IT.'],
      feasibility_score: 96,
      recommended_tag: 'Immediate First Step',
      draft_template_id: 'draft_bsa_cert',
    },
  ],
  precedents: [
    {
      id: 'prec_d1',
      case_title: 'Vijay Kumar Ghai & Ors. vs. State of West Bengal',
      citation: '(2022) 7 SCC 124',
      court: 'Supreme Court of India',
      coram: 'Hon’ble S. Abdul Nazeer & Krishna Murari, JJ.',
      decision_date: '22 Mar 2022',
      status_badge: 'Good Law (Landmark)',
      outcome_tag: 'Civil Breach vs Cheating Test',
      similarity_score: 95,
      matched_sections: ['Section 420 IPC / Section 318(4) BNS', 'Section 482 CrPC / 528 BNSS'],
      ratio_decidendi:
        'To establish cheating under Section 420 IPC / 318(4) BNS, fraudulent intention must exist at the very inception of transaction. If goods are procured by issuing cheques from an already closed account, dishonest intention at inception is established and proceedings cannot be quashed as a pure civil breach.',
      facts_summary:
        'Supreme Court laid down test distinguishing mere breach of contract from criminal cheating.',
      petitioner_arguments: ['Transaction is commercial; dispute belongs to civil court.'],
      respondent_arguments: [
        'Issuance of cheques from closed account shows dishonest intent from day one.',
      ],
      judge_findings: 'Pre-existing account closure establishes mens rea at inception.',
    },
    {
      id: 'prec_d2',
      case_title: 'Bir Singh vs. Mukesh Kumar',
      citation: '(2019) 4 SCC 197',
      court: 'Supreme Court of India',
      coram: 'Hon’ble R. Banumathi & Indira Banerjee, JJ.',
      decision_date: '06 Feb 2019',
      status_badge: 'Good Law (Landmark)',
      outcome_tag: 'Section 139 NI Act Statutory Presumption',
      similarity_score: 96,
      matched_sections: ['Section 138 & 139 NI Act'],
      ratio_decidendi:
        'A meaningful reading of Section 139 of the Act makes it clear that the presumption is in favour of the holder of the cheque. Factual admission of signature mandates statutory presumption of legally enforceable debt.',
      facts_summary:
        'Accused admitted cheque signature. Supreme Court held conviction under Section 138 mandatory.',
      petitioner_arguments: ['Statutory presumption operates once signature is admitted.'],
      respondent_arguments: ['Cheque was issued as security only.'],
      judge_findings: 'Security cheques also attract liability under Section 138.',
    },
  ],
  sample_enrichment_text:
    'HDFC Bank Branch Manager confirmed: "Account No. 502000192819 was closed on 10 Oct 2025 due to chronic overdraft default. Accused issued cheques on 15 Nov 2025 fully aware account was non-existent."',
  sample_enrichment_doc_name: 'HDFC_Bank_Manager_Account_Closure_Certificate.pdf',
};

export const ALL_MATTERS: Record<string, MatterCase> = {
  orion_v_delta: CASE_ORION_V_DELTA,
  cloudnet_v_starlight: CASE_CLOUDNET_V_STARLIGHT,
  precision_v_vanguard: CASE_PRECISION_V_VANGUARD,
  shivam_v_bansal: CASE_SHIVAM_V_BANSAL,
};

// -----------------------------------------------------------------------------
// DRAFT PLEADINGS & NOTICE GENERATOR
// -----------------------------------------------------------------------------
export function generateDraftDocument(
  templateId: string,
  matter: MatterCase,
): { title: string; content: string } {
  const disclaimer = `/*
===============================================================================
AI-GENERATED SUGGESTION – FOR HUMAN REVIEW ONLY
This draft notice / pleading is generated automatically from extracted case documents.
It must be reviewed, verified, and settled by qualified legal counsel prior to issuance.
===============================================================================
*/\n\n`;

  if (templateId === 'draft_sec21_arbitration') {
    return {
      title: 'Section 21 Notice of Invocation of Arbitration (DIAC)',
      content:
        disclaimer +
        `BY SPEED POST & REGISTERED EMAIL
Date: 27 February 2026

To,
Delta Systems & Infra LLP,
Through its Designated Partners,
Golf Course Road, Sector 54, Gurugram, Haryana - 122002.

SUBJECT: NOTICE OF INVOCATION OF ARBITRATION UNDER SECTION 21 OF THE ARBITRATION AND CONCILIATION ACT, 1996 READ WITH CLAUSE 19.1 OF MASTER SUPPLY AGREEMENT DATED 10 FEB 2024.

Sir/Madam,

Under instructions from and on behalf of our Client, M/s Orion Components Pvt. Ltd., having its registered office at Okhla Industrial Area, New Delhi (hereinafter "Our Client"), we hereby serve upon you this formal Notice of Invocation of Arbitration:

1. That Our Client and you entered into a Master Supply Agreement dated 10 February 2024 ("MSA") for the supply of high-grade structural steel and Ready Mix Concrete (RMC).

2. That pursuant to purchase orders, Our Client duly supplied consignments valued at ₹1,85,00,000/- covered under Invoices INV-1041 to INV-1046, which were accepted without demur under countersigned delivery challans DC-1041 to DC-1046 on 14 January 2026.

3. That under Clause 14.1 of the MSA, any objection regarding quality was required to be communicated within 15 calendar days of delivery. You failed to raise any objection within the stipulated window. Your belated unilateral Debit Notes (DN-44 and DN-45) dated 02 February 2026 are arbitrary, legally impermissible, and hit by waiver.

4. That after adjusting your partial payment of ₹35,00,000/- received on 12 February 2026, an admitted principal sum of ₹1,50,00,000/- (Rupees One Crore Fifty Lakhs Only) remains outstanding, along with agreed commercial interest @ 18% per annum under Clause 7.4.

5. In terms of Clause 19.1 of the MSA, all disputes arising out of the contract shall be referred to arbitration under the aegis of the Delhi International Arbitration Centre (DIAC).

6. Our Client hereby proposes the following panel of three independent Arbitrators, any one of whom may be nominated as the Sole Arbitrator:
   (i) Hon'ble Mr. Justice [A.K. Sikri], Former Judge, Supreme Court of India.
   (ii) Hon'ble Ms. Justice [Gita Mittal], Former Chief Justice, High Court of Jammu & Kashmir.
   (iii) Hon'ble Mr. Justice [Najmi Waziri], Former Judge, High Court of Delhi.

Please confirm your concurrence to any one of the above within thirty (30) days, failing which Our Client shall proceed to file an application under Section 11(6) of the Arbitration and Conciliation Act, 1996 before the Hon'ble High Court of Delhi.

Yours faithfully,
For and on behalf of Orion Components Pvt. Ltd.

[Advocate / Legal Counsel]
Encl: Certified Statement of Account & Delivery Challans`,
    };
  }

  if (templateId === 'draft_sec9_hc') {
    return {
      title: 'Section 9 Interim Measures Petition (High Court of Delhi)',
      content:
        disclaimer +
        `IN THE HIGH COURT OF DELHI AT NEW DELHI
(COMMERCIAL DIVISION / ORIGINAL CIVIL JURISDICTION)
O.M.P. (I) (COMM) NO. ______ OF 2026

IN THE MATTER OF:
Orion Components Pvt. Ltd.                       ...Petitioner
                           VERSUS
Delta Systems & Infra LLP                        ...Respondent

PETITION UNDER SECTION 9 OF THE ARBITRATION AND CONCILIATION ACT, 1996 SEEKING URGENT INTERIM MEASURES PENDING ARBITRATION

MOST RESPECTFULLY SHOWETH:
1. That the Petitioner is filing the present petition seeking an interim direction to the Respondent to deposit an amount of ₹1,50,00,000/- (Rupees One Crore Fifty Lakhs Only) in an interest-bearing Fixed Deposit Receipt (FDR) with the Registrar General of this Hon'ble Court.

2. That the Petitioner has supplied construction materials worth ₹1,85,00,000/- covered under 6 GST invoices. The Respondent has withheld ₹1,50,00,000/- without providing any NABL laboratory test reports required under Clause 14.2 of the Master Supply Agreement.

3. That reliable market intelligence indicates the Respondent is creating third-party rights over its ongoing residential project to defeat future arbitral awards.

PRAYER:
It is therefore respectfully prayed that this Hon'ble Court may be pleased to:
(a) Direct the Respondent to deposit ₹1,50,00,000/- with this Hon'ble Court or furnish an unconditional Bank Guarantee;
(b) Restrain the Respondent from alienating or creating encumbrances over its assets;
(c) Pass such other and further orders as this Hon'ble Court may deem fit.

PETITIONER THROUGH COUNSEL`,
    };
  }

  if (templateId === 'draft_sec12a_form1') {
    return {
      title: 'Section 12A Pre-Institution Mediation Application (Form 1 - DSLSA)',
      content:
        disclaimer +
        `FORM 1
[See Rule 3(1)]
APPLICATION FOR PRE-INSTITUTION MEDIATION UNDER SECTION 12A OF THE COMMERCIAL COURTS ACT, 2015

BEFORE THE DELHI STATE LEGAL SERVICES AUTHORITY / COMMERCIAL COURT MEDIATION CENTRE
DISTRICT COURTS PATIALA HOUSE, NEW DELHI

IN THE MATTER OF:
${matter.facts.find((f) => f.label.includes('Claimant') || f.label.includes('Creditor') || f.label.includes('Provider'))?.value || 'Applicant'}
                                                        ...APPLICANT
                           VERSUS
${matter.facts.find((f) => f.label.includes('Respondent') || f.label.includes('Debtor') || f.label.includes('Client'))?.value || 'Opposite Party'}
                                                        ...OPPOSITE PARTY

1. DETAILS OF THE DISPUTE:
   - Nature of Commercial Transaction: Supply of Goods / Service Agreement
   - Total Value of Claim: ${matter.claim_amount}
   - Cause of Action: Breach of payment obligation & refusal to clear admitted invoices.

2. BRIEF SUMMARY OF DISPUTE:
   Applicant supplied goods/services in terms of the contract. The Opposite Party has defaulted on outstanding dues of ${matter.claim_amount} despite receipt of statutory demand notice.

3. SETTLEMENT PROPOSAL:
   The Applicant is willing to settle the dispute amicably if the Opposite Party pays the principal balance within a structured 30-day timeline.

APPLICANT THROUGH COUNSEL`,
    };
  }
  if (templateId === 'draft_sec138_ni_complaint') {
    return {
      title: 'Criminal Complaint under Section 138 / 141 NI Act (Court of MM, Delhi)',
      content:
        disclaimer +
        `IN THE COURT OF CHIEF METROPOLITAN MAGISTRATE (CENTRAL)
TIS HAZARI COURTS, DELHI
CRIMINAL COMPLAINT NO. ______ OF 2026

IN THE MATTER OF:
Shivam Polymers Pvt. Ltd.,
Through its Authorized Director Mr. Vikram Sethi,
Industrial Area Phase 1, Naraina, New Delhi - 110028.            ...COMPLAINANT
                           VERSUS
1. Bansal Packaging LLP,
   Through its Partners,
   B-44, Lawrence Road Industrial Area, Delhi - 110035.
2. Rajesh Bansal (Managing Director / Partner)
3. Sangeeta Bansal (Partner / Signatory)                        ...ACCUSED PERSONS

COMPLAINT UNDER SECTION 138 READ WITH SECTION 141 AND 142 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881 FOR DISHONOUR OF CHEQUES VALUED AT ₹92,00,000/-

MOST RESPECTFULLY SHOWETH:
1. That the Complainant is a registered company engaged in manufacturing and supply of industrial polymer granules.

2. That the Accused No. 1 is an LLP, and Accused Nos. 2 & 3 are its partners in-charge of and responsible for the day-to-day conduct of its business within the meaning of Section 141 of the NI Act.

3. That towards discharge of legally enforceable debt for raw materials supplied under verified tax invoices, Accused No. 2 with concurrence of Accused No. 3 issued four (4) post-dated cheques totaling ₹92,00,000/- (Cheque Nos. 004811 to 004814 drawn on HDFC Bank).

4. That upon presentation, all four cheques were returned dishonoured with bank return memos dated 04 January 2026 bearing remark "Account Closed".

5. That Complainant served statutory legal notice dated 15 January 2026 via Speed Post (Tracking ED771928110IN) which was duly delivered on 18 January 2026. The Accused have failed to pay the amount within the statutory period of fifteen (15) days.

PRAYER:
It is therefore respectfully prayed that this Hon'ble Court may be pleased to:
(a) Summon, try, and punish Accused Nos. 1, 2, and 3 under Section 138 read with Section 141 of the Negotiable Instruments Act, 1881;
(b) Award compensation to the Complainant up to twice the cheque amount (₹1,84,00,000/-) under Section 357(3) CrPC / 395 BNSS.

COMPLAINANT THROUGH COUNSEL`,
    };
  }

  if (templateId === 'draft_reply_quashing_528') {
    return {
      title: 'Reply to Petition under Section 528 BNSS / 482 CrPC (High Court of Delhi)',
      content:
        disclaimer +
        `IN THE HIGH COURT OF DELHI AT NEW DELHI
(CRIMINAL MISCELLANEOUS / INHERENT JURISDICTION)
CRL. M.C. NO. ______ OF 2026

IN THE MATTER OF:
Rajesh Bansal & Anr.                                            ...PETITIONERS
                           VERSUS
State (NCT of Delhi) & Shivam Polymers Pvt. Ltd.                ...RESPONDENTS

REPLY ON BEHALF OF RESPONDENT NO. 2 (COMPLAINANT) TO PETITION UNDER SECTION 528 BNSS (FORMERLY SECTION 482 CrPC) SEEKING QUASHING OF FIR NO. 142/2026

MOST RESPECTFULLY SHOWETH:
1. That the present quashing petition is an abuse of process. The Petitioners fraudulently induced Respondent No. 2 to deliver 80 MT Polymer Granules worth ₹92 Lakhs by issuing cheques from an account that was already closed on 10 Oct 2025 prior to issuance.

2. That the Supreme Court in 'Vijay Kumar Ghai v. State of West Bengal, (2022) 7 SCC 124' held that where fraudulent intention exists at the very inception of transaction (as evidenced by issuing cheques from a pre-closed account), Section 482 CrPC / 528 BNSS cannot be invoked to stifle genuine criminal prosecution.

3. That the Petitioners have evaded Section 35(3) BNSS notices issued by the Investigating Officer and their custodial interrogation is urgently required to unearth the money trail.

PRAYER:
Dismiss the petition with exemplary costs.

RESPONDENT NO. 2 THROUGH COUNSEL`,
    };
  }

  // Generic Default Legal Demand Notice
  return {
    title: 'Statutory Legal Demand Notice',
    content:
      disclaimer +
      `LEGAL DEMAND NOTICE
Date: 27 February 2026

To,
${matter.facts.find((f) => f.label.includes('Respondent') || f.label.includes('Debtor') || f.label.includes('Client'))?.value || 'The Respondent'}

SUBJECT: FINAL STATUTORY DEMAND NOTICE FOR PAYMENT OF OUTSTANDING SUM OF ${matter.claim_amount}.

Sir/Madam,

Under instructions from Our Client (${matter.facts.find((f) => f.label.includes('Claimant') || f.label.includes('Creditor') || f.label.includes('Provider'))?.value || 'Our Client'}), we hereby state as follows:

1. That pursuant to contracts and invoices on record, Our Client supplied goods/services to you, and an outstanding principal balance of ${matter.claim_amount} remains unpaid.

2. That you are hereby called upon to remit the total outstanding amount along with contractual interest within fifteen (15) days of receipt of this notice, failing which Our Client shall initiate formal legal proceedings before the competent courts of law at your sole risk, cost, and consequences.

Yours faithfully,
[Advocate for Claimant]`,
  };
}
