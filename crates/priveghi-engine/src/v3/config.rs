//! Every rules number of the dead's wake in one place: the knob list of SYSTEMS_v3_MORTUL.md §13,
//! defaults as the chapter proposes them. The economy's floats (rates, standing, accumulators) are
//! carried as integers in thousandths (`_m`) so the run reproduces the simulator's output on every
//! platform (addendum §3). Renderer timings live in src/tuning.ts.

use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Config {
    /// Length of one day; its last `zi_noapte_ms` are night on their own. Chapter §3 `zi_s` 60, `zi_noapte_s` 20.
    pub zi_ms: u64,
    pub zi_noapte_ms: u64,
    /// The flame gutters with a dry tick this long before a close (Telegraph Law).
    pub precue_ms: u64,
    /// Days in the wake: the nine-day M0 wake. Chapter §10.
    pub zile: u8,
    /// The memorial days; the ninth is the demo's ending beat. Chapter §7 `soroace` 3 / 9 / 40.
    pub soroace: Vec<u8>,
    /// The body is buried at the close of this day; the village opens to you that night. Chapter §7, §9.
    pub burial_day: u8,
    /// Rada keens through this day and on the soroace: every rate multiplied. Chapter §4 `rada_mult`.
    pub rada_zile: u8,
    pub rada_mult_m: u32,
    /// Draguta sleeps within reach from this day. Chapter §9.
    pub draguta_from: u8,
    /// Full days a loose Dor lasts. Chapter §4 `dor_zile`.
    pub dor_zile: u8,
    /// Dor the troita's sill holds, and the closes between a tied Dor's days. Chapter §4 `sill`, `sill_zile`.
    pub sill: u8,
    pub sill_zile: u8,
    /// Day-one rate per source, thousandths: Mama, Draguta, Frate de cruce, Dusman, Preot. Chapter §4 `base[]`.
    pub base_m: [u32; 5],
    /// Forgetting per day, thousandths; Dusman's own. Chapter §4 `forget`, `forget_dusman`.
    pub forget_m: u32,
    pub forget_dusman_m: u32,
    /// Where each source's accumulator starts, thousandths: primed, so the first longing is on the cloth on day one. Chapter §4 `acc_start`.
    pub acc_start_m: u32,
    /// Dor per source per day, and per day in all. Chapter §4 `dor_max_src`, `dor_max_day`.
    pub dor_max_src: u32,
    pub dor_max_day: usize,
    /// Standing a one-point memory adds (a two-point one: double), its cap, its daily fade; thousandths. Chapter §4, §5.
    pub amintire_rate_m: u32,
    pub standing_cap_m: u32,
    pub amintire_fade_m: u32,
    /// A Pomenire that finds Uitare at 0 adds this to its person's floor. Chapter §7 `pomenire_standing`.
    pub pomenire_standing_m: u32,
    /// Dusman's and Preot's rates rise by this per point of Spaima above `fear_from`. Chapter §8 `fear_dor`.
    pub fear_dor_m: u32,
    pub fear_from: u8,
    /// Closes a thing used rests. Chapter §5 `lucru_odihna`. Days a dream's pomana stays: `pomana_zile`.
    pub lucru_odihna: u8,
    pub pomana_zile: u8,
    /// Fragments held at most. Chapter §5.
    pub franturi_max: usize,
    /// Putere: the max, and the regen at each close. Chapter §6.
    pub putere: u8,
    pub putere_regen: u8,
    /// What each act costs. Chapter §6.
    pub cost_urneste: u8,
    pub cost_sopteste: u8,
    pub cost_arata: u8,
    pub cost_umbla: u8,
    pub cost_asculta: u8,
    /// Dreams a night; the match cap on a sleeper dreamed two nights running. Chapter §6 `vis_max`, `vis_repeat_cap`.
    pub vis_max: u8,
    pub vis_repeat_cap: u8,
    /// ARATA-TE by day: many see it, its Pomenire multiplied. Chapter §6 `arata_zi_mult`.
    pub arata_zi_mult: u8,
    /// The vigil nights: through this day the masked players take the blame for night acts. Chapter §6 `masti_zile`.
    pub masti_zile: u8,
    /// Uitare's ending, the candle's threshold and its relight, the soroc's limit, the wedding's. Chapter §7, §3, §10.
    pub uitare_cap: u8,
    pub candle_uitare: u8,
    pub candle_relight_zile: u8,
    pub soroc_uitare_max: u8,
    pub nunta_uitare: u8,
    /// Uitare added: a guttered Dor, a skipped soroc, a dawn with no candle. Chapter §7.
    pub uitare_guttered: u8,
    pub uitare_soroc_sarit: u8,
    pub uitare_dark_dawn: u8,
    /// Uitare taken off. Chapter §7 `pomenire[]`.
    pub pomenire_soroc: u8,
    pub pomenire_minune: u8,
    pub pomenire_minunat: u8,
    pub pomenire_bun: u8,
    pub pomenire_vie: u8,
    pub pomenire_vis_minunat: u8,
    pub pomenire_dezlegare: u8,
    /// Spaima by act, [day, night], and its extras. Chapter §8 `spaima[]`.
    pub spaima_urneste: [u8; 2],
    pub spaima_sopteste: [u8; 2],
    pub spaima_arata: [u8; 2],
    pub spaima_repeat_sleeper: u8,
    pub spaima_minunat_arata: u8,
    pub spaima_stinge: u8,
    /// A vrajba Amintire made: the enemy stops talking. Chapter §7.
    pub spaima_vrajba_calm: u8,
    pub spaima_cap: u8,
    pub spaima_decay: u8,
    pub rest_spaima: u8,
    /// The priest's threshold, the days his service runs, the service that ends the wake; the Hunter's. Chapter §8.
    pub spaima_preot: u8,
    pub preot_zile: u8,
    /// Spaima after his service begins (chapter §8: "resets to 3").
    pub preot_spaima: u8,
    pub preot_services_max: u8,
    pub spaima_vanator: u8,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            zi_ms: 60_000,
            zi_noapte_ms: 20_000,
            precue_ms: 400,
            zile: 9,
            soroace: vec![3, 9],
            burial_day: 3,
            rada_zile: 3,
            rada_mult_m: 1500,
            draguta_from: 2,
            dor_zile: 3,
            sill: 3,
            sill_zile: 3,
            base_m: [450, 350, 300, 350, 200],
            forget_m: 920,
            forget_dusman_m: 750,
            acc_start_m: 500,
            dor_max_src: 1,
            dor_max_day: 3,
            amintire_rate_m: 100,
            standing_cap_m: 600,
            amintire_fade_m: 20,
            pomenire_standing_m: 50,
            fear_dor_m: 100,
            fear_from: 3,
            lucru_odihna: 3,
            pomana_zile: 3,
            franturi_max: 2,
            putere: 4,
            putere_regen: 2,
            cost_urneste: 1,
            cost_sopteste: 1,
            cost_arata: 2,
            cost_umbla: 1,
            cost_asculta: 0,
            vis_max: 1,
            vis_repeat_cap: 1,
            arata_zi_mult: 2,
            masti_zile: 2,
            uitare_cap: 9,
            candle_uitare: 4,
            candle_relight_zile: 2,
            soroc_uitare_max: 6,
            nunta_uitare: 3,
            uitare_guttered: 1,
            uitare_soroc_sarit: 3,
            uitare_dark_dawn: 1,
            pomenire_soroc: 3,
            pomenire_minune: 3,
            pomenire_minunat: 2,
            pomenire_bun: 1,
            pomenire_vie: 1,
            pomenire_vis_minunat: 1,
            pomenire_dezlegare: 1,
            spaima_urneste: [2, 1],
            spaima_sopteste: [0, 0],
            spaima_arata: [3, 2],
            spaima_repeat_sleeper: 1,
            spaima_minunat_arata: 1,
            spaima_stinge: 1,
            spaima_vrajba_calm: 1,
            spaima_cap: 9,
            spaima_decay: 1,
            rest_spaima: 1,
            spaima_preot: 6,
            preot_zile: 3,
            preot_spaima: 3,
            preot_services_max: 3,
            spaima_vanator: 9,
        }
    }
}
