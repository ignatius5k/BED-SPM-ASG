using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PRG2_Gruberoo
{
    internal class SpecialOffer
    {
        // Attributes
        public string OfferCode { get; set; }
        public string OfferDesc { get; set; }
        public double Discount { get; set; }

        // Class Constructors
        public SpecialOffer() { }
        public SpecialOffer(string offerCode, string offerDesc, double discount)
        {
            OfferCode = offerCode;
            OfferDesc = offerDesc;
            Discount = discount;
        }

        // Methods
        public override string ToString()
        {
            return $"{OfferCode}: {OfferDesc} - Discount: {Discount}%";
        }
    }
}
