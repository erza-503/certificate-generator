package model

// type HardSkillPDF struct {
// 	// HardSkillName       string  `json:"hard_skill_name" bson:"hard_skill_name"`
// 	// HardSkillCode       string  `json:"hard_skill_code" bson:"hard_skill_code"`
// 	// HardSkillDesc       string  `json:"hard_skill_desc" bson:"hard_skill_desc"`
// 	HardSkills          []Skill `json:"skills" bson:"skills"`
// 	TotalHardSkillJP    uint64  `json:"total_hardSkill_jp" bson:"total_hardSkill_jp"`
// 	TotalHardSkillScore float64 `json:"total_hardSkill_score" bson:"total_hardSkill_score"`
// }

// type SoftSkillPDF struct {
// 	// SoftSkillName       string  `json:"soft_skill_name" bson:"soft_skill_name"`
// 	// SoftSkillCode       string  `json:"soft_skill_code" bson:"soft_skill_code"`
// 	// SoftSkillDesc       string  `json:"soft_skill_desc" bson:"soft_skill_desc"`
// 	SoftSkills          []Skill `json:"skills" bson:"skills"`
// 	TotalSoftSkillJP    uint64  `json:"total_softSkill_jp" bson:"total_softSkill_jp"`
// 	TotalSoftSkillScore float64 `json:"total_softSkill_score" bson:"total_softSkill_score"`
// }

type SkillPDF struct {
	Skills          []Skill `json:"skills" bson:"skills"`
	TotalSkillJP    uint64  `json:"total_skill_jp" bson:"total_skill_jp"`
	TotalSkillScore float64 `json:"total_skill_score" bson:"total_skill_score"`
}