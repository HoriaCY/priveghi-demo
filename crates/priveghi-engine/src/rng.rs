//! PCG32 (O'Neill, XSH-RR). Small, seedable, and serialisable: the state travels as decimal
//! strings because a browser's JSON.parse would round a 64-bit number and fork the run.

use serde::{Deserialize, Deserializer, Serialize, Serializer};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Rng {
    #[serde(with = "u64_text")]
    state: u64,
    #[serde(with = "u64_text")]
    inc: u64,
}

impl Rng {
    pub fn new(seed: u64) -> Rng {
        let mut r = Rng { state: 0, inc: (0xda3e_39cb_94b9_5bdb << 1) | 1 };
        r.next_u32();
        r.state = r.state.wrapping_add(seed);
        r.next_u32();
        r
    }

    pub fn next_u32(&mut self) -> u32 {
        let old = self.state;
        self.state = old.wrapping_mul(6_364_136_223_846_793_005).wrapping_add(self.inc);
        let xorshifted = (((old >> 18) ^ old) >> 27) as u32;
        let rot = (old >> 59) as u32;
        xorshifted.rotate_right(rot)
    }

    /// Uniform in `lo..=hi` (rejection sampling, so small ranges carry no bias).
    pub fn range(&mut self, lo: u32, hi: u32) -> u32 {
        let span = hi - lo + 1;
        let zone = u32::MAX - (u32::MAX % span);
        loop {
            let x = self.next_u32();
            if x < zone {
                return lo + x % span;
            }
        }
    }
}

mod u64_text {
    use super::*;

    pub fn serialize<S: Serializer>(v: &u64, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&v.to_string())
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<u64, D::Error> {
        let text = String::deserialize(d)?;
        text.parse().map_err(serde::de::Error::custom)
    }
}
