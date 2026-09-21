const { passwordSchema } = require('../src/utils/passwordPolicy');

describe('politique des mots de passe', () => {
  test('accepte un mot de passe fort', () => {
    expect(passwordSchema.safeParse('APILD-Coordination#2026').success).toBe(true);
  });

  test('refuse un mot de passe court ou incomplet', () => {
    expect(passwordSchema.safeParse('password').success).toBe(false);
    expect(passwordSchema.safeParse('LongPasswordOnly').success).toBe(false);
    expect(passwordSchema.safeParse('Long password1!').success).toBe(false);
  });
});
