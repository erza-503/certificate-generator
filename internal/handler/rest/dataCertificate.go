package rest

import (
	"context"
	"pkl/finalProject/certificate-generator/internal/database"
	"pkl/finalProject/certificate-generator/internal/generator"
	model "pkl/finalProject/certificate-generator/model"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func CreateCertificate(c *fiber.Ctx) error {
	// add body request
	var pdfReq struct {
		Data model.CertificateData `json:"data" bson:"data"`
		Zoom float64               `json:"zoom"`
	}

	// parse the body request
	if err := c.BodyParser(&pdfReq); err != nil {
		return BadRequest(c, "Invalid body request", "Invalid req body")
	}

	// connect collection certificate in database
	certificateCollection := database.GetCollection("certificate")
	competenceCollection := database.GetCollection("competence")
	counterCollection := database.GetCollection("counters")

	// generate DataID (random string with 8 letter)
	newDataID, err := generator.GetUniqueRandomID(certificateCollection, 8)
	if err != nil {
		return InternalServerError(c, "Failed to generate Data ID", "Server failed generate Data ID")
	}

	// generate qrcode
	link := "http://localhost:3000/assets/certificate/"
	encstr, err := generator.GenerateQRCode(link, newDataID)
	if err != nil {
		return InternalServerError(c, "Failed to generate QRCode Img", "Server failed generate qrcode img")
	}

	// generate referral ID
	nextReferralID, err := generator.GenerateReferralID(counterCollection, time.Now())
	if err != nil {
		return InternalServerError(c, "Failed to generate Referral ID", "Server failed generate Referral ID")
	}

	// fetch Kompetensi by the given nama_kompetensi from the request
	var kompetensi model.Kompetensi
	filter := bson.M{"nama_kompetensi": pdfReq.Data.Kompetensi}
	err = competenceCollection.FindOne(context.TODO(), filter).Decode(&kompetensi)
	if err != nil {
		return NotFound(c, "Competence Not Found", "Fetch Kompetepetensi by the given nama_kompetensi from the request")
	}

	// can calculate jp & score automatically, but needs to have the correct json body

	totalHSJP, totalHSSkor := uint64(0), float64(0)
	for _, hs := range pdfReq.Data.HardSkills.Skills {
		totalHSJP += hs.SkillJP
		totalHSSkor += hs.SkillScore
	}

	totalSSJP, totalSSSkor := uint64(0), float64(0)
	for _, ss := range pdfReq.Data.SoftSkills.Skills {
		totalSSJP += ss.SkillJP
		totalSSSkor += ss.SkillScore
	}

	mappedData := model.CertificateData{
		SertifName: pdfReq.Data.SertifName,
		KodeReferral: model.KodeReferral{
			ReferralID: nextReferralID,
			Divisi:     pdfReq.Data.KodeReferral.Divisi,
			BulanRilis: pdfReq.Data.KodeReferral.BulanRilis,
			TahunRilis: pdfReq.Data.KodeReferral.TahunRilis,
		},
		NamaPeserta:    pdfReq.Data.NamaPeserta,
		SKKNI:          pdfReq.Data.SKKNI,
		KompetenBidang: pdfReq.Data.KompetenBidang,
		Kompetensi:     pdfReq.Data.Kompetensi,
		Validation:     pdfReq.Data.Validation,
		QRCode: model.QRCode{
			QRCodePDFID: newDataID,
			QRCodeLink:  link + newDataID + ".pdf",
			QRCodeEnc:   encstr,
		},
		DataID:    newDataID,
		TotalJP:   totalHSJP + totalSSJP,
		TotalMeet: pdfReq.Data.TotalMeet,
		MeetTime:  pdfReq.Data.MeetTime,
		ValidDate: pdfReq.Data.ValidDate,
		HardSkills: model.SkillPDF{
			Skills:          pdfReq.Data.HardSkills.Skills,
			TotalSkillJP:    totalHSJP,
			TotalSkillScore: totalHSSkor / float64(len(pdfReq.Data.HardSkills.Skills)),
		},
		SoftSkills: model.SkillPDF{
			Skills:          pdfReq.Data.SoftSkills.Skills,
			TotalSkillJP:    totalSSJP,
			TotalSkillScore: totalSSSkor / float64(len(pdfReq.Data.SoftSkills.Skills)),
		},
		FinalSkor: (totalHSSkor + totalSSSkor) / float64(len(pdfReq.Data.HardSkills.Skills)+len(pdfReq.Data.SoftSkills.Skills)),
	}

	certificate := model.PDF{
		ID:         primitive.NewObjectID(),
		DataID:     newDataID,
		SertifName: pdfReq.Data.SertifName,
		Data:       mappedData,
		Model: model.Model{
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
			DeletedAt: nil,
		},
	}

	if err = generator.CreatePDF(c, &mappedData, pdfReq.Zoom); err != nil {
		return InternalServerError(c, "can't create pdf file", err.Error())
	}
	// insert data from struct "PDF" to collection "certificate" in database MongoDB
	_, err = certificateCollection.InsertOne(context.TODO(), certificate)
	if err != nil {
		return InternalServerError(c, "Failed to create new certificate data", "Server failed create new certificate")
	}

	// return success
	return OK(c, "Success create new certificate", certificate)
}

// Function to se all Admin Account
func GetAllCertificates(c *fiber.Ctx) error {
	var results []bson.M

	certificateCollection := database.GetCollection("certificate")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// set the projection to return the required fields
	projection := bson.M{
		"_id":         1,
		"data_id":     1,
		"sertif_name": 1,
		"data":        1,
		"model":       1,
	}

	// find the projection
	cursor, err := certificateCollection.Find(ctx, bson.M{}, options.Find().SetProjection(projection))
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return NotFound(c, "No Documents Found", "No certificates found")
		}
		return InternalServerError(c, "Failed to fetch data", "mongodb error can't find data")
	}
	defer cursor.Close(ctx)

	// decode each document and append it to results
	for cursor.Next(ctx) {
		var certificate bson.M
		if err := cursor.Decode(&certificate); err != nil {
			return InternalServerError(c, "Failed to decode data", "Cannot decode data")
		}
		results = append(results, certificate)
	}
	if err := cursor.Err(); err != nil {
		return InternalServerError(c, "Cursor error", "Cursor error")
	}

	// return success
	return OK(c, "Success get all data", results)
}

func GetCertificateByID(c *fiber.Ctx) error {
	// Get acc_id from params
	idParam := c.Params("id")

	// connect to collection in mongoDB
	certificateCollection := database.GetCollection("certificate")

	// make filter to find document based on data_id (incremental id)
	filter := bson.M{"data_id": idParam}

	// Variable to hold search results
	var accountDetail bson.M

	// Find a single document that matches the filter
	err := certificateCollection.FindOne(context.TODO(), filter).Decode(&accountDetail)
	if err != nil {
		// If not found, return a 404 status.
		if err == mongo.ErrNoDocuments {
			return NotFound(c, "Data not found", "Cannot find certificate")
		}
		// If in server error, return status 500
		return InternalServerError(c, "Failed to retrieve data", "Server can't find certificate")
	}

	// check if document is already deleted
	if deletedAt, ok := accountDetail["model"].(bson.M)["deleted_at"]; ok && deletedAt != nil {
		// Return the deletion time if the account is already deleted
		return AlreadyDeleted(c, "This certificate has already been deleted", "Check deleted certificate", deletedAt)
	}

	// return success
	return OK(c, "Success get certificate data", accountDetail)
}

// Function for soft delete admin account
func DeleteCertificate(c *fiber.Ctx) error {
	// Get dataid from params
	idParam := c.Params("id")

	// connect to collection in mongoDB
	certificateCollection := database.GetCollection("certificate")

	// make filter to find document based on acc_id (incremental id)
	filter := bson.M{"dataid": idParam}

	// find admin account
	var certificate bson.M
	err := certificateCollection.FindOne(context.TODO(), filter).Decode(&certificate)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return NotFound(c, "Certificate not found", "Cannot find certificate")
		}
		return InternalServerError(c, "Failed to fetch certificate", "server error cannot find certificate")
	}

	// Check if DeletedAt field already has a value
	if deletedAt, ok := certificate["model"].(bson.M)["deleted_at"]; ok && deletedAt != nil {
		// Return the deletion time if the certificate is already deleted
		return AlreadyDeleted(c, "This certificate has already been deleted", "Check deleted certificate", deletedAt)
	}

	// make update for input timestamp DeletedAt
	update := bson.M{"$set": bson.M{"model.deleted_at": time.Now()}}

	// update document in collection MongoDB
	result, err := certificateCollection.UpdateOne(context.TODO(), filter, update)
	if err != nil {
		return InternalServerError(c, "Failed to delete certificate", "Delete certificate")
	}

	// Check if the document is found and updated
	if result.MatchedCount == 0 {
		return NotFound(c, "Certificate not found", "Found certificate")
	}

	// Respons success
	return OK(c, "Successfully deleted certificate", idParam)
}

// {
//     "sertif_name": "Sertifikat pertama",
//     "kode_referral": [
//         {
//             "divisi": "BIS",
//             "bulan_rilis": "V",
//             "tahun_rilis": "2024"
//         }
//     ],
//     "nama_peserta": "I Kadek Pande Feri Dwi Wijaya",
//     "skkni": "SKKNI Nomor 56 Tahun 2018",
//     "kompeten_bidang": "Pengembangan Bisnis",
//     "kompetensi": "Leadership & Building Startup",
//     "valid_date": [
//         {
//             "valid_total": "3 Tahun",
//             "valid_start": "29 Agustus 2024",
//             "valid_end": "29 Agustus 2027"
//         }
//     ],
//     "validation": "Denpasar, 29 Agustus 2024",
//     "total_meet": "14 Pertemuan",
//     "meet_time": "3.5 Bulan"
// }
