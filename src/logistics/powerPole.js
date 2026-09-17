// Jednostavan 1x1 "stup" - gradi se drag-om (kao Road/Bridge), tile po
// tile. NEMA eksplicitnih .next/connections referenci kao conveyor - dvije
// susjedne (4-smjerno) power_pole celije su AUTOMATSKI dio iste mreze
// (vidi powerNetwork.js flood-fill). Isto vrijedi za zgrade koje dodiruju
// pole (power_plant/battery/potrosac) - nema posebnog "spoji klikom" koraka.
export class PowerPole {
  constructor(id, x, y) {
    this.id = id;
    this.kind = 'power_pole';
    this.x = x;
    this.y = y;
  }
}
