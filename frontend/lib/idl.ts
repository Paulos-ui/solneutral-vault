export const IDL = {
  version: "0.1.0",
  name: "solneutral",
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "vaultState",    isMut: true,  isSigner: false },
        { name: "authority",     isMut: true,  isSigner: true  },
        { name: "usdcMint",      isMut: false, isSigner: false },
        { name: "vaultUsdc",     isMut: true,  isSigner: false },
        { name: "tokenProgram",  isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "deposit",
      accounts: [
        { name: "vaultState",    isMut: true,  isSigner: false },
        { name: "userPosition",  isMut: true,  isSigner: false },
        { name: "user",          isMut: true,  isSigner: true  },
        { name: "userUsdc",      isMut: true,  isSigner: false },
        { name: "vaultUsdc",     isMut: true,  isSigner: false },
        { name: "tokenProgram",  isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "amount", type: "u64" }],
    },
    {
      name: "withdraw",
      accounts: [
        { name: "vaultState",   isMut: true,  isSigner: false },
        { name: "userPosition", isMut: true,  isSigner: false },
        { name: "user",         isMut: true,  isSigner: true  },
        { name: "userUsdc",     isMut: true,  isSigner: false },
        { name: "vaultUsdc",    isMut: true,  isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "rebalance",
      accounts: [
        { name: "vaultState", isMut: true,  isSigner: false },
        { name: "authority",  isMut: false, isSigner: true  },
      ],
      args: [
        { name: "fundingEarned", type: "u64" },
        { name: "newApyBps",     type: "u64" },
      ],
    },
  ],
  accounts: [
    {
      name: "VaultState",
      type: {
        kind: "struct",
        fields: [
          { name: "authority",      type: "publicKey" },
          { name: "usdcMint",       type: "publicKey" },
          { name: "vaultUsdc",      type: "publicKey" },
          { name: "totalDeposits",  type: "u64"       },
          { name: "totalShares",    type: "u64"       },
          { name: "netApyBps",      type: "u64"       },
          { name: "lastRebalance",  type: "i64"       },
          { name: "rebalanceCount", type: "u64"       },
          { name: "totalYield",     type: "u64"       },
          { name: "isActive",       type: "bool"      },
          { name: "bump",           type: "u8"        },
        ],
      },
    },
    {
      name: "UserPosition",
      type: {
        kind: "struct",
        fields: [
          { name: "owner",            type: "publicKey" },
          { name: "vault",            type: "publicKey" },
          { name: "depositedAmount",  type: "u64"       },
          { name: "shares",           type: "u64"       },
          { name: "depositTimestamp", type: "i64"       },
          { name: "unlockTimestamp",  type: "i64"       },
          { name: "yieldEarned",      type: "u64"       },
          { name: "isActive",         type: "bool"      },
        ],
      },
    },
  ],
  // ✅ Required by Anchor's BorshAccountsCoder — must be present even if empty
  types: [],
  errors: [
    { code: 6000, name: "DepositTooSmall",     msg: "Deposit amount is below the minimum of 10 USDC" },
    { code: 6001, name: "VaultInactive",       msg: "Vault is currently inactive"                    },
    { code: 6002, name: "StillLocked",         msg: "Position is still locked."                      },
    { code: 6003, name: "PositionInactive",    msg: "This position is no longer active"              },
    { code: 6004, name: "Unauthorized",        msg: "Unauthorized"                                   },
    { code: 6005, name: "MaxDrawdownExceeded", msg: "Max drawdown exceeded"                          },
  ],
};

export type SolneutralIDL = typeof IDL;